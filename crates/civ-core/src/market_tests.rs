//! Tests for market.rs: prices, the 5% spread, supply moving the price, and refused trades.

use super::*;
use crate::civ::CivId;
use crate::map::TileCoordinate;

fn trader(food: u32, coins: u32) -> Civ {
    let mut civ = Civ::new(CivId(0), TileCoordinate::new(3, 3).expect("on the map"));
    civ.resources.food = food;
    civ.coins = coins;
    civ
}

fn market_with_food_supply(food: u32) -> Market {
    let mut market = Market::OPENING;
    market.supply.food = food;
    market
}

#[test]
fn at_the_opening_supply_every_resource_costs_its_base_price() {
    let market = Market::OPENING;

    assert_eq!(market.price_bps(Resource::Food), 10_000);
    assert_eq!(market.price_bps(Resource::Ore), 12_500);
    assert_eq!(market.price_bps(Resource::Gold), 15_000);
}

#[test]
fn halving_the_supply_doubles_the_price() {
    let market = market_with_food_supply(100);

    assert_eq!(market.price_bps(Resource::Food), 20_000);
}

#[test]
fn prices_stay_between_a_quarter_and_four_times_the_base() {
    let flooded = market_with_food_supply(100_000);
    let empty = market_with_food_supply(0);

    assert_eq!(flooded.price_bps(Resource::Food), 2_500);
    assert_eq!(empty.price_bps(Resource::Food), 40_000);
}

#[test]
fn selling_pays_ninety_five_percent_and_lowers_the_price() {
    let mut market = Market::OPENING;
    let mut civ = trader(100, 0);

    let coins = sell(&mut market, &mut civ, Resource::Food, 100);

    // Priced at the supply after the sale (300): 1.00 × 200/300 = 0.6666 coins.
    // 100 × 0.6666 × 95% = 63.3, rounded down to 63.
    assert_eq!(coins, Ok(63));
    assert_eq!(civ.coins, 63);
    assert_eq!(civ.resources.food, 0);
    assert_eq!(market.supply.food, 300);
    assert!(market.price_bps(Resource::Food) < 10_000);
}

#[test]
fn buying_costs_one_hundred_and_five_percent_rounded_up_and_raises_the_price() {
    let mut market = Market::OPENING;
    let mut civ = trader(0, 100);

    let paid = buy(&mut market, &mut civ, Resource::Ore, 10);

    // Priced at the supply after the purchase (190): 1.25 × 200/190 = 1.3157 coins.
    // 10 × 1.3157 × 105% = 13.8, rounded up to 14.
    assert_eq!(paid, Ok(14));
    assert_eq!(civ.coins, 100 - 14);
    assert_eq!(civ.resources.ore, 10);
    assert_eq!(market.supply.ore, 190);
    assert!(market.price_bps(Resource::Ore) > 12_500);
}

#[test]
fn selling_and_buying_back_always_loses_coins() {
    // Guards against a money machine: for any size, a round trip must cost more than it earns.
    for amount in [1, 10, 50, 150, 400] {
        let mut market = Market::OPENING;
        let mut civ = trader(amount, 0);

        let earned = sell(&mut market, &mut civ, Resource::Food, amount).expect("has the food");
        let price_back = market.purchase_cost(Resource::Food, amount);

        assert!(
            price_back > earned,
            "amount {amount}: earned {earned}, back {price_back}"
        );
    }
}

#[test]
fn a_civ_cannot_sell_what_it_does_not_have_or_buy_what_it_cannot_pay_for() {
    let mut market = Market::OPENING;
    let mut civ = trader(5, 3);

    let oversell = sell(&mut market, &mut civ, Resource::Food, 6);
    let overbuy = buy(&mut market, &mut civ, Resource::Gold, 10);

    assert_eq!(oversell, Err(ActionError::CannotAfford));
    assert_eq!(overbuy, Err(ActionError::CannotAfford));
    assert_eq!(market, Market::OPENING);
    assert_eq!(civ.resources.food, 5);
    assert_eq!(civ.coins, 3);
}

#[test]
fn buying_more_than_the_market_holds_is_refused() {
    let mut market = market_with_food_supply(5);
    let mut civ = trader(0, 10_000);

    let result = buy(&mut market, &mut civ, Resource::Food, 6);

    assert_eq!(result, Err(ActionError::NotEnoughSupply));
}

#[test]
fn a_trade_of_zero_is_refused() {
    let mut market = Market::OPENING;
    let mut civ = trader(10, 10);

    let result = sell(&mut market, &mut civ, Resource::Food, 0);

    assert_eq!(result, Err(ActionError::NothingToTrade));
}

#[test]
fn the_market_is_12_plain_bytes() {
    assert_eq!(std::mem::size_of::<Market>(), 12);
}
