//! Tests for format.rs: every rule survives encode then decode, and bad bytes are refused.

use super::*;

fn rule(conditions: &[Condition], action: PolicyAction) -> Rule {
    let mut slots = [None; MAX_CONDITIONS_PER_RULE];
    for (slot, condition) in slots.iter_mut().zip(conditions) {
        *slot = Some(*condition);
    }
    Rule {
        conditions: slots,
        action,
    }
}

fn food_below(amount: u32) -> Condition {
    Condition {
        value: Value::Food,
        comparison: Comparison::Less,
        right: Operand::Number(amount),
    }
}

/// One rule per kind of action, with a mix of conditions.
fn every_kind_of_rule() -> Vec<Rule> {
    let price_high = Condition {
        value: Value::GoldPrice,
        comparison: Comparison::Greater,
        right: Operand::PercentOf {
            percent: 150,
            value: Value::BaseGoldPrice,
        },
    };
    vec![
        rule(&[food_below(40)], PolicyAction::Build(UnitKind::Worker)),
        rule(&[], PolicyAction::Rush),
        rule(&[food_below(1), price_high], PolicyAction::FoundCity),
        rule(&[], PolicyAction::ClaimTile(TileTarget::NearestDeposit)),
        rule(&[], PolicyAction::ClaimTile(TileTarget::NearestFree)),
        rule(&[], PolicyAction::AssignWorkers(None)),
        rule(&[], PolicyAction::AssignWorkers(Some(Resource::Ore))),
        rule(&[price_high], PolicyAction::Sell(Resource::Gold, 20)),
        rule(&[], PolicyAction::Buy(Resource::Ore, 10)),
        rule(
            &[food_below(5), food_below(6), food_below(7)],
            PolicyAction::Attack {
                target: CivTarget::WeakestNeighbor,
                choice: CityFallChoice::Raze,
            },
        ),
    ]
}

#[test]
fn every_kind_of_rule_survives_encoding_and_decoding() {
    let rules = every_kind_of_rule();

    let bytes = encode_policy(&rules).expect("a valid rule count");

    assert_eq!(validate_policy(&bytes), Ok(rules.len()));
    for (index, original) in rules.iter().enumerate() {
        assert_eq!(read_rule(&bytes, index).as_ref(), Some(original));
    }
}

#[test]
fn a_full_policy_is_at_most_499_bytes() {
    let rules = vec![rule(&[], PolicyAction::Rush); MAX_RULES_PER_POLICY];

    let bytes = encode_policy(&rules).expect("16 rules is allowed");

    assert_eq!(bytes.len(), MAX_POLICY_BYTES);
    assert_eq!(MAX_POLICY_BYTES, 499);
}

#[test]
fn no_rules_or_too_many_rules_are_refused() {
    let too_many = vec![rule(&[], PolicyAction::Rush); MAX_RULES_PER_POLICY + 1];

    assert_eq!(encode_policy(&[]), Err(PolicyFormatError::BadRuleCount));
    assert_eq!(
        encode_policy(&too_many),
        Err(PolicyFormatError::BadRuleCount)
    );
}

#[test]
fn bytes_that_are_not_a_policy_are_refused() {
    let good = encode_policy(&every_kind_of_rule()).expect("valid");
    let mut wrong_magic = good.clone();
    wrong_magic[0] = b'X';
    let mut future_version = good.clone();
    future_version[1] = 2;
    let truncated = &good[..good.len() - 1];

    assert_eq!(
        validate_policy(&wrong_magic),
        Err(PolicyFormatError::NotAPolicy)
    );
    assert_eq!(
        validate_policy(&future_version),
        Err(PolicyFormatError::UnsupportedVersion)
    );
    assert_eq!(
        validate_policy(truncated),
        Err(PolicyFormatError::WrongLength)
    );
    assert_eq!(validate_policy(&[]), Err(PolicyFormatError::WrongLength));
}

#[test]
fn junk_in_an_unused_slot_is_refused_so_each_policy_has_one_byte_form() {
    let mut bytes = encode_policy(&[rule(&[], PolicyAction::Rush)]).expect("valid");
    // The first condition slot is unused (an `always` rule); put a stray byte in it.
    bytes[HEADER_BYTES + 1] = 1;

    assert_eq!(
        validate_policy(&bytes),
        Err(PolicyFormatError::BadCondition { rule: 0 })
    );
}

#[test]
fn an_unknown_action_kind_is_refused() {
    let mut bytes = encode_policy(&[rule(&[], PolicyAction::Rush)]).expect("valid");
    let action_start = HEADER_BYTES + 1 + CONDITION_BYTES * MAX_CONDITIONS_PER_RULE;
    bytes[action_start] = 99;

    assert_eq!(
        validate_policy(&bytes),
        Err(PolicyFormatError::BadAction { rule: 0 })
    );
}
