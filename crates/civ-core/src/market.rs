//! The market (docs/decisions/0007, "Market"): one market shared by every civ in a match, where
//! Food, Ore and Gold are bought and sold for coins.
//!
//! - `price = base × 200 ÷ max(supply, 1)`, kept within 25%–400% of base. Selling adds to the
//!   supply (the price falls); buying takes from it (the price rises).
//! - Every trade loses 5% to the spread: a seller gets 95% of the price, a buyer pays 105%.
//! - A trade is priced at the supply **after** it: a big sale gets the lower price it causes, a big
//!   purchase pays the higher one. With the price from before the trade, selling and buying back
//!   at once would make free coins.
//! - Prices are in coins × 10_000 ("price bps"), so 12_500 means 1.25 coins.
//!
//! `Market` is 12 plain bytes, so the program can store it as zero-copy account data.

use bytemuck::{Pod, Zeroable};

use crate::actions::ActionError;
use crate::civ::Civ;
use crate::resources::{Resource, ResourceStock};
use crate::rules::{
    BPS_PER_WHOLE, MARKET_BASE_PRICE, MARKET_MAX_PRICE_BPS, MARKET_MIN_PRICE_BPS,
    MARKET_SPREAD_BPS, MARKET_TARGET_SUPPLY,
};

/// The shared market: how much of each resource it holds.
#[repr(C)]
#[derive(Clone, Copy, PartialEq, Eq, Debug, Pod, Zeroable)]
pub struct Market {
    /// Units of each resource the market holds. Sets the prices.
    pub supply: ResourceStock,
}

impl Market {
    /// The market at the start of a match: MARKET_TARGET_SUPPLY of each, so every price is its
    /// base price.
    pub const OPENING: Market = Market {
        supply: ResourceStock {
            food: MARKET_TARGET_SUPPLY,
            ore: MARKET_TARGET_SUPPLY,
            gold: MARKET_TARGET_SUPPLY,
        },
    };

    /// The current price of one unit of `resource`, in coins × 10_000.
    pub fn price_bps(&self, resource: Resource) -> u64 {
        price_at_supply(resource, self.supply.amount(resource))
    }

    /// Coins a civ would get for selling `amount` of `resource` now: 95% of the price the supply
    /// will have after the sale, rounded down.
    pub fn sale_value(&self, resource: Resource, amount: u32) -> u32 {
        let supply_after = self.supply.amount(resource).saturating_add(amount);
        let seller_share_bps = bps_per_whole().saturating_sub(u64::from(MARKET_SPREAD_BPS));
        let value_bps = price_at_supply(resource, supply_after)
            .saturating_mul(u64::from(amount))
            .saturating_mul(seller_share_bps);
        // Two divisions by 10_000: one for the price scale, one for the seller's share.
        let coins = value_bps / bps_per_whole() / bps_per_whole();
        u32::try_from(coins).unwrap_or(u32::MAX)
    }

    /// Coins a civ would pay to buy `amount` of `resource` now: 105% of the price the supply will
    /// have after the purchase, rounded up.
    pub fn purchase_cost(&self, resource: Resource, amount: u32) -> u32 {
        let supply_after = self.supply.amount(resource).saturating_sub(amount);
        let buyer_share_bps = bps_per_whole().saturating_add(u64::from(MARKET_SPREAD_BPS));
        let cost_bps = price_at_supply(resource, supply_after)
            .saturating_mul(u64::from(amount))
            .saturating_mul(buyer_share_bps);
        // Rounded up so the spread is never lost to rounding.
        let coins = cost_bps.div_ceil(bps_per_whole() * bps_per_whole());
        u32::try_from(coins).unwrap_or(u32::MAX)
    }
}

/// The price of one unit of `resource` when the market holds `supply` of it, in coins × 10_000:
/// `base × 200 ÷ max(supply, 1)`, kept within 25%–400% of base.
fn price_at_supply(resource: Resource, supply: u32) -> u64 {
    let base = u64::from(MARKET_BASE_PRICE.amount(resource));
    let supply = u64::from(supply.max(1));
    let raw_price = base.saturating_mul(u64::from(MARKET_TARGET_SUPPLY)) / supply;

    let lowest = base.saturating_mul(u64::from(MARKET_MIN_PRICE_BPS)) / bps_per_whole();
    let highest = base.saturating_mul(u64::from(MARKET_MAX_PRICE_BPS)) / bps_per_whole();
    raw_price.clamp(lowest, highest)
}

/// 10_000 as a u64, for the price maths.
fn bps_per_whole() -> u64 {
    u64::from(BPS_PER_WHOLE)
}

/// The civ sells `amount` of `resource` to the market. Returns the coins it got.
///
/// Checks: civ is alive; amount is more than 0; the civ holds that much.
/// Effects: the resource goes to the market's supply; the civ gets `sale_value` coins.
/// `sale_value` and `purchase_cost` show a policy the price before it trades.
pub fn sell(
    market: &mut Market,
    civ: &mut Civ,
    resource: Resource,
    amount: u32,
) -> Result<u32, ActionError> {
    // Step 1: checks
    check_trade(civ, amount)?;
    let goods = ResourceStock::only(resource, amount);
    if !civ.resources.can_afford(&goods) {
        return Err(ActionError::CannotAfford);
    }

    // Step 2: price the sale (at the supply after it), then swap goods for coins.
    let coins = market.sale_value(resource, amount);
    civ.resources.subtract(&goods);
    civ.coins = civ.coins.saturating_add(coins);
    market.supply.add(resource, amount);
    Ok(coins)
}

/// The civ buys `amount` of `resource` from the market. Returns the coins it paid.
///
/// Checks: civ is alive; amount is more than 0; the market holds that much; the civ has the coins.
/// Effects: the civ pays `purchase_cost` coins and gets the resource from the market's supply.
pub fn buy(
    market: &mut Market,
    civ: &mut Civ,
    resource: Resource,
    amount: u32,
) -> Result<u32, ActionError> {
    // Step 1: checks
    check_trade(civ, amount)?;
    let goods = ResourceStock::only(resource, amount);
    if !market.supply.can_afford(&goods) {
        return Err(ActionError::NotEnoughSupply);
    }
    let cost = market.purchase_cost(resource, amount);
    if civ.coins < cost {
        return Err(ActionError::CannotAfford);
    }

    // Step 2: the cost was priced at the supply after the purchase; swap coins for goods.
    civ.coins = civ.coins.saturating_sub(cost);
    civ.resources.add(resource, amount);
    market.supply.subtract(&goods);
    Ok(cost)
}

/// The checks every trade shares.
fn check_trade(civ: &Civ, amount: u32) -> Result<(), ActionError> {
    if !civ.is_alive() {
        return Err(ActionError::CivIsOut);
    }
    if amount == 0 {
        return Err(ActionError::NothingToTrade);
    }
    Ok(())
}

// Tests live in market_tests.rs (see conquest.rs for how `#[path]` works).
#[cfg(test)]
#[path = "market_tests.rs"]
mod tests;
