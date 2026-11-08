//! Battle maths: who wins a fight and what each side loses (docs/decisions/0006, section 5).
//! Pure numbers only. What happens to the map and the cities afterwards is in conquest.rs; the
//! `attack` action that ties them together is in attack.rs.
//!
//! Strengths are "bps-scaled": every unit's attack or defence is multiplied by a bonus in basis
//! points (10_000 = ×1), so all maths stays in integers. Both sides use the same scale, so
//! comparing them is fair.

use crate::randomness::{MatchRandom, RandomPurpose};
use crate::rules::{
    unit_stats, BATTLE_ROLL_BPS, BPS_PER_WHOLE, CAPITAL_WALLS_BONUS_BPS, ELITE_MATCHUP_BPS,
    SIEGE_VS_WALLS_BPS, STRONG_MATCHUP_BPS, WALLS_PER_CITY_SIZE,
};
use crate::units::{UnitCounts, UnitKind};

/// What a battle decided.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub struct BattleOutcome {
    /// True if the attack beat the defence (ties go to the defender).
    pub did_attacker_win: bool,
    /// The attacker's strength after its roll.
    pub attack_strength: u64,
    /// The defender's strength (units + walls) after its roll.
    pub defence_strength: u64,
    /// Units the attacker lost.
    pub attacker_losses: UnitCounts,
    /// Units the defender lost at the target.
    pub defender_losses: UnitCounts,
}

/// The defending city, if the target is a city: what its walls are made of.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub struct DefendingCity {
    /// City size (1 to 5). Walls = 10 × size.
    pub size: u8,
    /// Capitals get +50% walls.
    pub is_capital: bool,
}

/// The two random rolls of one battle, each between 9_000 and 11_000 bps (±10%).
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub struct BattleRolls {
    pub attack_roll_bps: u32,
    pub defence_roll_bps: u32,
}

impl BattleRolls {
    /// No swing at all (×1 each side). Handy in tests.
    pub const EVEN: BattleRolls = BattleRolls {
        attack_roll_bps: BPS_PER_WHOLE,
        defence_roll_bps: BPS_PER_WHOLE,
    };

    /// The rolls for a battle on `tile_index` in `turn`, from the match seed. Same seed, turn and
    /// tile always give the same rolls.
    pub fn for_battle(random: &MatchRandom, turn: u16, tile_index: usize) -> BattleRolls {
        // usize -> u64 only ever widens, so `as` is safe here.
        let tile_number = tile_index as u64;
        let roll_range = u64::from(BATTLE_ROLL_BPS) * 2 + 1; // 0..=2_000
        let turn_number = u64::from(turn);
        let attack_offset = random.below(
            RandomPurpose::BattleAttackRoll,
            turn_number,
            tile_number,
            roll_range,
        );
        let defence_offset = random.below(
            RandomPurpose::BattleDefenceRoll,
            turn_number,
            tile_number,
            roll_range,
        );
        BattleRolls {
            attack_roll_bps: roll_from_offset(attack_offset),
            defence_roll_bps: roll_from_offset(defence_offset),
        }
    }
}

/// Turns an offset in 0..=2_000 into a roll in 9_000..=11_000 bps.
fn roll_from_offset(offset: u64) -> u32 {
    let lowest_roll = BPS_PER_WHOLE - BATTLE_ROLL_BPS;
    lowest_roll.saturating_add(u32::try_from(offset).unwrap_or(0))
}

/// Fights one battle: `attackers` against `defenders` (and walls, if the target is a city).
///
/// Attack > defence: the attacker wins, loses nothing, and every defender there is destroyed.
/// Otherwise: the attacker loses `units × defence ÷ (attack + defence)` of each kind and the
/// defender `units × attack ÷ (attack + defence)`, both rounded down.
pub fn resolve_battle(
    attackers: &UnitCounts,
    defenders: &UnitCounts,
    city: Option<DefendingCity>,
    rolls: BattleRolls,
) -> BattleOutcome {
    // Step 1: each side's strength, then its roll.
    let is_city = city.is_some();
    let attack_strength = apply_roll(
        attack_strength(attackers, defenders, is_city),
        rolls.attack_roll_bps,
    );
    let defence_strength = apply_roll(defence_strength(defenders, city), rolls.defence_roll_bps);

    // Step 2: a win destroys every defender there.
    if attack_strength > defence_strength {
        return BattleOutcome {
            did_attacker_win: true,
            attack_strength,
            defence_strength,
            attacker_losses: UnitCounts::NONE,
            defender_losses: *defenders,
        };
    }

    // Step 3: a failed attack costs both sides, in proportion to the other side's strength.
    let total = attack_strength.saturating_add(defence_strength);
    BattleOutcome {
        did_attacker_win: false,
        attack_strength,
        defence_strength,
        attacker_losses: share_of(attackers, defence_strength, total),
        defender_losses: share_of(defenders, attack_strength, total),
    }
}

/// Σ units × attack × matchup bonus, bps-scaled. Settlers have 0 attack, so they add nothing.
pub fn attack_strength(attackers: &UnitCounts, defenders: &UnitCounts, is_city: bool) -> u64 {
    let mut total: u64 = 0;
    for kind in UnitKind::ALL {
        let count = u64::from(attackers.count(kind));
        let attack = u64::from(unit_stats(kind).attack);
        let bonus = u64::from(matchup_bonus_bps(kind, defenders, is_city));
        total = total.saturating_add(count.saturating_mul(attack).saturating_mul(bonus));
    }
    total
}

/// Σ defending units × defence + walls, bps-scaled.
pub fn defence_strength(defenders: &UnitCounts, city: Option<DefendingCity>) -> u64 {
    let mut total: u64 = 0;
    for kind in UnitKind::ALL {
        let count = u64::from(defenders.count(kind));
        let defence = u64::from(unit_stats(kind).defence);
        total = total.saturating_add(count.saturating_mul(defence));
    }
    let units_bps = total.saturating_mul(u64::from(BPS_PER_WHOLE));
    units_bps.saturating_add(walls_bps(city))
}

/// A city's walls, bps-scaled: 10 × size, +50% for a capital. No city, no walls.
fn walls_bps(city: Option<DefendingCity>) -> u64 {
    let Some(city) = city else {
        return 0;
    };
    let walls = u64::from(WALLS_PER_CITY_SIZE).saturating_mul(u64::from(city.size));
    let mut bonus_bps = u64::from(BPS_PER_WHOLE);
    if city.is_capital {
        bonus_bps = bonus_bps.saturating_add(u64::from(CAPITAL_WALLS_BONUS_BPS));
    }
    walls.saturating_mul(bonus_bps)
}

/// How much `kind` is boosted against this defence, in bps.
///
/// - Elite: ×1.25 against everything.
/// - Siege against a city: ×1.5 (it is strong against walls).
/// - Otherwise: ×1.5 against the defenders it is strong against, ×1 against the rest, averaged
///   over how many defenders there are of each kind. No defenders: ×1.
fn matchup_bonus_bps(kind: UnitKind, defenders: &UnitCounts, is_city: bool) -> u32 {
    if kind == UnitKind::Elite {
        return ELITE_MATCHUP_BPS;
    }
    if kind == UnitKind::Siege && is_city {
        return SIEGE_VS_WALLS_BPS;
    }
    let total_defenders = defenders.total();
    if total_defenders == 0 {
        return BPS_PER_WHOLE;
    }
    let weak_defenders = match strong_against(kind) {
        Some(weak_kind) => u32::from(defenders.count(weak_kind)),
        None => 0,
    };
    let other_defenders = total_defenders.saturating_sub(weak_defenders);
    let weighted = weak_defenders
        .saturating_mul(STRONG_MATCHUP_BPS)
        .saturating_add(other_defenders.saturating_mul(BPS_PER_WHOLE));
    weighted / total_defenders
}

/// The rock-paper-scissors table: which kind each kind beats. Elite and Settler have none (the
/// Elite's bonus is handled on its own).
pub fn strong_against(kind: UnitKind) -> Option<UnitKind> {
    match kind {
        UnitKind::Infantry => Some(UnitKind::Siege),
        UnitKind::Guard => Some(UnitKind::Infantry),
        UnitKind::Siege => Some(UnitKind::Guard),
        UnitKind::Elite | UnitKind::Settler => None,
    }
}

/// Multiplies a strength by a roll in bps.
fn apply_roll(strength: u64, roll_bps: u32) -> u64 {
    strength.saturating_mul(u64::from(roll_bps)) / u64::from(BPS_PER_WHOLE)
}

/// `units × part ÷ whole` of each kind, rounded down. Used for losses.
fn share_of(units: &UnitCounts, part: u64, whole: u64) -> UnitCounts {
    let mut share = UnitCounts::NONE;
    if whole == 0 {
        return share;
    }
    for kind in UnitKind::ALL {
        let lost = u64::from(units.count(kind)).saturating_mul(part) / whole;
        // lost <= count because part <= whole, so it always fits back in a u16.
        share.add(kind, u16::try_from(lost).unwrap_or(u16::MAX));
    }
    share
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::randomness::{MatchSeed, MATCH_SEED_LENGTH};

    fn army(infantry: u16, guard: u16, siege: u16, elite: u16) -> UnitCounts {
        UnitCounts {
            infantry,
            guard,
            siege,
            elite,
            settler: 0,
        }
    }

    #[test]
    fn a_bigger_army_beats_a_smaller_one_on_open_land_and_loses_nothing() {
        let attackers = army(10, 0, 0, 0);
        let defenders = army(2, 0, 0, 0);

        let outcome = resolve_battle(&attackers, &defenders, None, BattleRolls::EVEN);

        assert!(outcome.did_attacker_win);
        assert_eq!(outcome.attacker_losses, UnitCounts::NONE);
        assert_eq!(outcome.defender_losses, defenders);
    }

    #[test]
    fn guards_beat_infantry_because_of_the_matchup_bonus() {
        // 4 infantry attack 4 × 3 = 12; 3 guards defend 3 × 5 = 15. Infantry has no bonus on guards.
        let attackers = army(4, 0, 0, 0);
        let defenders = army(0, 3, 0, 0);

        let outcome = resolve_battle(&attackers, &defenders, None, BattleRolls::EVEN);

        assert!(!outcome.did_attacker_win);
    }

    #[test]
    fn siege_breaks_guards_it_is_strong_against() {
        // 3 siege attack 3 × 6 × 1.5 = 27 against 4 guards defending 4 × 5 = 20.
        let attackers = army(0, 0, 3, 0);
        let defenders = army(0, 4, 0, 0);

        let outcome = resolve_battle(&attackers, &defenders, None, BattleRolls::EVEN);

        assert!(outcome.did_attacker_win);
        assert_eq!(outcome.attack_strength, 27 * u64::from(BPS_PER_WHOLE));
    }

    #[test]
    fn a_capitals_walls_are_half_again_as_strong() {
        let no_units = UnitCounts::NONE;
        let city = DefendingCity {
            size: 2,
            is_capital: false,
        };
        let capital = DefendingCity {
            size: 2,
            is_capital: true,
        };

        let city_defence = defence_strength(&no_units, Some(city));
        let capital_defence = defence_strength(&no_units, Some(capital));

        assert_eq!(city_defence, 20 * u64::from(BPS_PER_WHOLE));
        assert_eq!(capital_defence, 30 * u64::from(BPS_PER_WHOLE));
    }

    #[test]
    fn a_failed_attack_costs_both_sides_in_proportion() {
        // Attack 5 × 3 = 15 vs defence 5 × 5 = 25 (total 40). Attacker loses 5 × 25/40 = 3,
        // defender loses 5 × 15/40 = 1 (rounded down).
        let attackers = army(5, 0, 0, 0);
        let defenders = army(0, 5, 0, 0);

        let outcome = resolve_battle(&attackers, &defenders, None, BattleRolls::EVEN);

        assert!(!outcome.did_attacker_win);
        assert_eq!(outcome.attacker_losses.count(UnitKind::Infantry), 3);
        assert_eq!(outcome.defender_losses.count(UnitKind::Guard), 1);
    }

    #[test]
    fn a_tie_goes_to_the_defender() {
        // 5 guards attack 5 × 2 = 10; 2 guards defend 2 × 5 = 10.
        let outcome = resolve_battle(
            &army(0, 5, 0, 0),
            &army(0, 2, 0, 0),
            None,
            BattleRolls::EVEN,
        );

        assert!(!outcome.did_attacker_win);
    }

    #[test]
    fn battle_rolls_stay_within_ten_percent_and_repeat_for_the_same_battle() {
        let random = MatchRandom::new(&MatchSeed([3; MATCH_SEED_LENGTH]));

        for tile_index in 0..256 {
            let rolls = BattleRolls::for_battle(&random, 7, tile_index);
            let again = BattleRolls::for_battle(&random, 7, tile_index);

            assert_eq!(rolls, again);
            assert!((9_000..=11_000).contains(&rolls.attack_roll_bps));
            assert!((9_000..=11_000).contains(&rolls.defence_roll_bps));
        }
    }
}
