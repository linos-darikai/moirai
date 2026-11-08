//! Tests for compiler.rs: the sample bots compile, rules mean what they say, and every kind of
//! mistake is reported on the right line.

use super::*;
use crate::policy::format::{read_rule, validate_policy};
use crate::policy::AttackObjective;

/// The four sample bots from `policies/` (also the bots civ-cli plays).
const SAMPLE_POLICIES: [&str; 4] = [
    include_str!("../../../../policies/turtle.yaml"),
    include_str!("../../../../policies/raider.yaml"),
    include_str!("../../../../policies/trader.yaml"),
    include_str!("../../../../policies/expander.yaml"),
];

fn problems(yaml: &str) -> Vec<(usize, &'static str)> {
    match compile_policy(yaml) {
        Ok(_) => Vec::new(),
        Err(errors) => errors
            .iter()
            .map(|error| (error.line, error.problem.code()))
            .collect(),
    }
}

#[test]
fn every_sample_bot_compiles_to_valid_bytes() {
    for yaml in SAMPLE_POLICIES {
        let compiled = compile_policy(yaml);

        let compiled = compiled.unwrap_or_else(|errors| panic!("{yaml}\n{errors:?}"));
        assert!(validate_policy(&compiled.bytes).is_ok());
        assert!(!compiled.name.is_empty());
    }
}

#[test]
fn a_rule_compiles_to_what_it_says() {
    let yaml = "name: test\nversion: 2\nrules:\n  # sell when gold is dear\n  - if: gold_price > 150% base_gold_price and gold >= 20\n    do: sell(gold, 20)\n";

    let compiled = compile_policy(yaml).expect("valid policy");
    let rule = read_rule(&compiled.bytes, 0).expect("one rule");

    assert_eq!(compiled.name, "test");
    assert_eq!(rule.action, PolicyAction::Sell(Resource::Gold, 20));
    assert_eq!(
        rule.conditions[0],
        Some(Condition {
            value: Value::GoldPrice,
            comparison: Comparison::Greater,
            right: Operand::PercentOf {
                percent: 150,
                value: Value::BaseGoldPrice
            },
        })
    );
    assert_eq!(
        rule.conditions[1],
        Some(Condition {
            value: Value::Gold,
            comparison: Comparison::GreaterOrEqual,
            right: Operand::Number(20),
        })
    );
    assert_eq!(rule.conditions[2], None);
}

#[test]
fn always_rules_and_attacks_with_raze_compile() {
    let yaml = "name: t\nrules:\n  - if: always\n    do: attack(strongest_neighbor, raze)\n";

    let compiled = compile_policy(yaml).expect("valid policy");
    let rule = read_rule(&compiled.bytes, 0).expect("one rule");

    assert_eq!(rule.conditions, [None; MAX_CONDITIONS_PER_RULE]);
    assert_eq!(
        rule.action,
        PolicyAction::Attack {
            target: CivTarget::StrongestNeighbor,
            objective: AttackObjective::Border,
            choice: CityFallChoice::Raze
        }
    );
}

#[test]
fn unknown_words_are_reported_on_their_line() {
    let yaml = "name: t\nrules:\n  - if: mana > 3\n    do: build(dragon)\n  - if: always\n    do: teleport\n";

    let found = problems(yaml);

    assert!(found.contains(&(3, "unknownValue")));
    assert!(found.contains(&(4, "badArguments")));
    assert!(found.contains(&(6, "unknownAction")));
}

#[test]
fn a_policy_needs_a_name_and_rules() {
    let found = problems("version: 1\n");

    assert!(found.contains(&(0, "missingName")));
    assert!(found.contains(&(0, "noRules")));
}

#[test]
fn a_rule_without_do_and_a_do_without_a_rule_are_reported() {
    let yaml = "name: t\nrules:\n  do: rush\n  - if: always\n";

    let found = problems(yaml);

    assert!(found.contains(&(3, "doWithoutIf")));
    assert!(found.contains(&(4, "missingDo")));
}

#[test]
fn more_than_three_conditions_or_sixteen_rules_are_refused() {
    let four_conditions =
        "name: t\nrules:\n  - if: food > 1 and ore > 1 and gold > 1 and coins > 1\n    do: rush\n";
    let mut seventeen_rules = String::from("name: t\nrules:\n");
    for _ in 0..17 {
        seventeen_rules.push_str("  - if: always\n    do: rush\n");
    }

    assert!(problems(four_conditions).contains(&(3, "tooManyConditions")));
    assert!(problems(&seventeen_rules).contains(&(0, "tooManyRules")));
}

#[test]
fn comparisons_need_a_symbol_and_a_whole_number() {
    let yaml =
        "name: t\nrules:\n  - if: food lots\n    do: rush\n  - if: food < 1.5\n    do: rush\n";

    let found = problems(yaml);

    assert!(found.contains(&(3, "missingComparison")));
    assert!(found.contains(&(5, "badNumber")));
}

#[test]
fn unknown_top_level_keys_and_stray_indented_lines_are_reported() {
    let yaml = "name: t\n  - if: always\nauthor: me\nrules:\n  - if: always\n    do: rush\n";

    let found = problems(yaml);

    assert!(found.contains(&(2, "lineOutsideRules")));
    assert!(found.contains(&(3, "unknownKey")));
}

#[test]
fn error_messages_read_as_plain_english() {
    let errors = compile_policy("name: t\nrules:\n  - if: mana > 3\n    do: rush\n")
        .expect_err("mana is not a value");

    let message = errors[0].to_string();

    assert_eq!(message, "line 3: unknown value `mana`");
}

#[test]
fn each_problem_names_the_word_it_is_about() {
    let errors = compile_policy("name: t\nrules:\n  - if: mana > 3\n    do: cast(fire)\n")
        .expect_err("two problems");

    let details: Vec<(&str, String)> = errors
        .iter()
        .map(|error| (error.problem.code(), error.problem.detail()))
        .collect();

    assert!(details.contains(&("unknownValue", "mana".to_string())));
    assert!(details.contains(&("unknownAction", "cast".to_string())));
}

#[test]
fn attacks_can_name_any_target_and_an_objective_in_either_order() {
    let yaml = "name: t\nrules:\n  - if: always\n    do: attack(richest_enemy, raze, capital)\n  - if: always\n    do: attack(nearest_enemy, city)\n";

    let compiled = compile_policy(yaml).expect("valid policy");

    assert_eq!(
        read_rule(&compiled.bytes, 0).map(|rule| rule.action),
        Some(PolicyAction::Attack {
            target: CivTarget::RichestEnemy,
            objective: AttackObjective::Capital,
            choice: CityFallChoice::Raze
        })
    );
    assert_eq!(
        read_rule(&compiled.bytes, 1).map(|rule| rule.action),
        Some(PolicyAction::Attack {
            target: CivTarget::NearestEnemy,
            objective: AttackObjective::City,
            choice: CityFallChoice::Capture
        })
    );
}

#[test]
fn an_attack_with_two_objectives_or_an_unknown_target_is_refused() {
    let yaml = "name: t\nrules:\n  - if: always\n    do: attack(leader, city, capital)\n  - if: always\n    do: attack(the_moon)\n";

    let found = problems(yaml);

    assert!(found.contains(&(4, "badArguments")));
    assert!(found.contains(&(6, "badArguments")));
}
