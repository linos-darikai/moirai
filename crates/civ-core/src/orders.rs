//! Orders: the actions a civ chose for one turn, and how one action is applied.
//!
//! A policy (later: the interpreter) turns into at most MAX_ACTIVE_RULES_PER_TURN actions per civ
//! per turn. `run_turn` (turn.rs) applies them phase by phase in `ActionPhase` order; inside a
//! phase, civs act in rotating order (docs/decisions/0007, "Turn order", step 5).

use crate::actions::{claim_tile, found_city, ActionError};
use crate::builds::{rush_build, start_build};
use crate::civ::CivId;
use crate::conquest::CityFallChoice;
use crate::map::TileCoordinate;
use crate::march::dispatch_expedition;
use crate::market::{buy, sell};
use crate::match_state::MatchState;
use crate::resources::Resource;
use crate::rules::MAX_ACTIVE_RULES_PER_TURN;
use crate::units::UnitKind;

/// One thing a civ can do on its turn. Like a TypeScript tagged union: each variant carries the
/// data that action needs.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Action {
    /// Start building a unit in the first idle city (builds.rs).
    StartBuild(UnitKind),
    /// Finish the build in this city slot now, for coins (builds.rs).
    RushBuild { city_slot: u8 },
    /// Use a Settler to found a city on this site (actions.rs).
    FoundCity(TileCoordinate),
    /// Buy this free tile next to the civ's land (actions.rs).
    ClaimTile(TileCoordinate),
    /// Send Workers to this resource first, or spread them evenly with `None`.
    AssignWorkers(Option<Resource>),
    /// Sell this much of a resource for coins (market.rs).
    Sell(Resource, u32),
    /// Buy this much of a resource with coins (market.rs).
    Buy(Resource, u32),
    /// Send the army to this enemy tile, where it fights on arrival; capture or raze a city that
    /// falls (march.rs, docs/decisions/0010).
    Attack {
        target: TileCoordinate,
        choice: CityFallChoice,
    },
}

/// The order in which kinds of action resolve within a turn: every civ's builds first, then
/// every civ's city founding, and so on, ending with attacks.
#[derive(Clone, Copy, PartialEq, Eq, Debug, PartialOrd, Ord)]
pub enum ActionPhase {
    Builds,
    FoundCities,
    ClaimTiles,
    AssignWorkers,
    Trades,
    Attacks,
}

impl ActionPhase {
    /// Every phase, in the order they resolve.
    pub const ALL: [ActionPhase; 6] = [
        ActionPhase::Builds,
        ActionPhase::FoundCities,
        ActionPhase::ClaimTiles,
        ActionPhase::AssignWorkers,
        ActionPhase::Trades,
        ActionPhase::Attacks,
    ];
}

impl Action {
    /// Which phase this action resolves in.
    pub fn phase(&self) -> ActionPhase {
        match self {
            Action::StartBuild(_) | Action::RushBuild { .. } => ActionPhase::Builds,
            Action::FoundCity(_) => ActionPhase::FoundCities,
            Action::ClaimTile(_) => ActionPhase::ClaimTiles,
            Action::AssignWorkers(_) => ActionPhase::AssignWorkers,
            Action::Sell(..) | Action::Buy(..) => ActionPhase::Trades,
            Action::Attack { .. } => ActionPhase::Attacks,
        }
    }
}

/// One civ's chosen actions for a turn, in the order its policy listed them. Empty slots are
/// `None`.
#[derive(Clone, Copy, PartialEq, Eq, Debug, Default)]
pub struct CivOrders {
    pub actions: [Option<Action>; MAX_ACTIVE_RULES_PER_TURN],
}

impl CivOrders {
    /// No actions at all (the civ just lets its economy run).
    pub const NONE: CivOrders = CivOrders {
        actions: [None; MAX_ACTIVE_RULES_PER_TURN],
    };

    /// Orders from a list of up to MAX_ACTIVE_RULES_PER_TURN actions; extra ones are ignored.
    pub fn from_actions(actions: &[Action]) -> CivOrders {
        let mut orders = CivOrders::NONE;
        for (slot, action) in orders.actions.iter_mut().zip(actions) {
            *slot = Some(*action);
        }
        orders
    }
}

/// What an action did when it succeeded.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum ActionEffect {
    /// The action happened and has nothing more to report.
    Done,
    /// A build started in this city slot.
    BuildStarted { city_slot: usize },
    /// Coins changed hands: paid for a rush or a purchase, or earned by a sale.
    Coins(u32),
    /// The army set out; it arrives in this many turns (the fight is in the turn report then).
    Dispatched { turns_to_arrive: u8 },
}

/// Applies one action for the civ at `civ_index` on the current turn.
pub fn apply_action(
    state: &mut MatchState,
    civ_index: usize,
    action: Action,
) -> Result<ActionEffect, ActionError> {
    let turn = state.turn;
    let civ_count = state.civ_count();
    // Taking the struct apart lets us borrow the map, the civs and the market separately at the
    // same time (borrowing `state` whole would lock all of it).
    let MatchState {
        map, civs, market, ..
    } = state;
    let civs = civs.get_mut(..civ_count).ok_or(ActionError::CivIsOut)?;

    if let Action::Attack { target, choice } = action {
        let attacker = CivId(u8::try_from(civ_index).map_err(|_| ActionError::CivIsOut)?);
        let dispatch = dispatch_expedition(map, civs, attacker, target, choice)?;
        return Ok(ActionEffect::Dispatched {
            turns_to_arrive: dispatch.turns_to_arrive,
        });
    }

    let civ = civs.get_mut(civ_index).ok_or(ActionError::CivIsOut)?;
    match action {
        Action::StartBuild(kind) => {
            let city_slot = start_build(civ, kind)?;
            Ok(ActionEffect::BuildStarted { city_slot })
        }
        Action::RushBuild { city_slot } => {
            let coins = rush_build(civ, usize::from(city_slot))?;
            Ok(ActionEffect::Coins(coins))
        }
        Action::FoundCity(site) => found_city(map, civ, site, turn).map(|_| ActionEffect::Done),
        Action::ClaimTile(tile) => claim_tile(map, civ, tile).map(|_| ActionEffect::Done),
        Action::AssignWorkers(focus) => {
            if !civ.is_alive() {
                return Err(ActionError::CivIsOut);
            }
            civ.set_worker_focus(focus);
            Ok(ActionEffect::Done)
        }
        Action::Sell(resource, amount) => {
            sell(market, civ, resource, amount).map(ActionEffect::Coins)
        }
        Action::Buy(resource, amount) => {
            buy(market, civ, resource, amount).map(ActionEffect::Coins)
        }
        // Never reached: attacks were handled above, because they need every civ, not one. Rust
        // still wants every variant covered; an error (not a panic) keeps the program safe.
        Action::Attack { .. } => Err(ActionError::NotAnEnemyTile),
    }
}
