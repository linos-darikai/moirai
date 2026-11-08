//! Policy compiler: YAML text to compiled policy bytes (docs/decisions/0008). Only built with the
//! `compiler` cargo feature (civ-wasm and civ-cli turn it on), so YAML reading never ends up in
//! the on-chain program.
//!
//! Policies use a small fixed subset of YAML (`name:`, `version:`, `rules:`, and `- if:` / `do:`
//! items), so a short hand-written reader is enough and no YAML library is needed. It reports
//! every problem it finds, each with its line number, so the editor can underline them all.

pub use super::compile_errors::{
    CompileError, CompileProblem, CompiledPolicy, MAX_POLICY_NAME_LENGTH,
};
use super::format::encode_policy;
use super::{
    CivTarget, Comparison, Condition, Operand, PolicyAction, Rule, TileTarget, Value,
    MAX_CONDITIONS_PER_RULE,
};
use crate::conquest::CityFallChoice;
use crate::resources::Resource;
use crate::rules::MAX_RULES_PER_POLICY;
use crate::units::UnitKind;

/// A rule as written, before its text is understood.
struct RawRule {
    line: usize,
    condition: String,
    action: Option<(usize, String)>,
}

/// Compiles a YAML policy. Returns every problem found if there is at least one.
pub fn compile_policy(yaml: &str) -> Result<CompiledPolicy, Vec<CompileError>> {
    let mut errors: Vec<CompileError> = Vec::new();

    // Step 1: read the lines into a name and raw rules.
    let (name, raw_rules) = read_lines(yaml, &mut errors);

    // Step 2: check the policy as a whole.
    check_name(name.as_deref(), &mut errors);
    if raw_rules.is_empty() {
        push(&mut errors, 0, CompileProblem::NoRules);
    }
    if raw_rules.len() > MAX_RULES_PER_POLICY {
        let count = raw_rules.len();
        push(&mut errors, 0, CompileProblem::TooManyRules { count });
    }

    // Step 3: understand each rule.
    let mut rules: Vec<Rule> = Vec::new();
    for raw in &raw_rules {
        if let Some(rule) = compile_rule(raw, &mut errors) {
            rules.push(rule);
        }
    }

    // Step 4: write the bytes.
    if !errors.is_empty() {
        return Err(errors);
    }
    match encode_policy(&rules) {
        Ok(bytes) => Ok(CompiledPolicy {
            name: name.unwrap_or_default(),
            bytes,
        }),
        Err(_) => Err(vec![CompileError {
            line: 0,
            problem: CompileProblem::NoRules,
        }]),
    }
}

/// Splits the text into the `name:` value and the raw `- if:` / `do:` pairs.
fn read_lines(yaml: &str, errors: &mut Vec<CompileError>) -> (Option<String>, Vec<RawRule>) {
    let mut name: Option<String> = None;
    let mut rules: Vec<RawRule> = Vec::new();
    let mut is_inside_rules = false;

    for (index, raw_line) in yaml.lines().enumerate() {
        let line_number = index + 1;
        // Everything after `#` is a comment.
        let line = raw_line.split('#').next().unwrap_or("");
        let text = line.trim();
        if text.is_empty() {
            continue;
        }
        let is_indented = line.starts_with(' ') || line.starts_with('\t');

        if !is_indented {
            is_inside_rules = read_top_level_line(text, line_number, &mut name, errors);
        } else if !is_inside_rules {
            push(errors, line_number, CompileProblem::LineOutsideRules);
        } else {
            read_rule_line(text, line_number, &mut rules, errors);
        }
    }
    (name, rules)
}

/// A line that isn't indented: `name:`, `version:` or `rules:`. Returns true for `rules:`.
fn read_top_level_line(
    text: &str,
    line_number: usize,
    name: &mut Option<String>,
    errors: &mut Vec<CompileError>,
) -> bool {
    if let Some(value) = text.strip_prefix("name:") {
        *name = Some(value.trim().to_string());
        return false;
    }
    if text.starts_with("version:") {
        return false; // allowed and ignored
    }
    if text == "rules:" {
        return true;
    }
    let key = text.split(':').next().unwrap_or(text).to_string();
    push(errors, line_number, CompileProblem::UnknownKey { key });
    false
}

/// An indented line inside `rules:`: starts a rule (`- if:`) or gives its action (`do:`).
fn read_rule_line(
    text: &str,
    line_number: usize,
    rules: &mut Vec<RawRule>,
    errors: &mut Vec<CompileError>,
) {
    if let Some(condition) = text.strip_prefix("- if:") {
        rules.push(RawRule {
            line: line_number,
            condition: condition.trim().to_string(),
            action: None,
        });
        return;
    }
    let Some(action) = text.strip_prefix("do:") else {
        push(errors, line_number, CompileProblem::UnknownRuleLine);
        return;
    };
    match rules.last_mut() {
        Some(rule) if rule.action.is_none() => {
            rule.action = Some((line_number, action.trim().to_string()));
        }
        _ => push(errors, line_number, CompileProblem::DoWithoutIf),
    }
}

fn check_name(name: Option<&str>, errors: &mut Vec<CompileError>) {
    match name {
        None | Some("") => push(errors, 0, CompileProblem::MissingName),
        Some(name) if name.chars().count() > MAX_POLICY_NAME_LENGTH => {
            push(errors, 0, CompileProblem::NameTooLong);
        }
        Some(_) => {}
    }
}

/// One raw rule to a `Rule`, or `None` (with errors recorded) if any part is wrong.
fn compile_rule(raw: &RawRule, errors: &mut Vec<CompileError>) -> Option<Rule> {
    let conditions = compile_conditions(&raw.condition, raw.line, errors);
    let Some((action_line, action_text)) = &raw.action else {
        push(errors, raw.line, CompileProblem::MissingDo);
        return None;
    };
    let action = match compile_action(action_text) {
        Ok(action) => action,
        Err(problem) => {
            push(errors, *action_line, problem);
            return None;
        }
    };
    Some(Rule {
        conditions: conditions?,
        action,
    })
}

/// `always`, or up to 3 comparisons joined with `and`.
fn compile_conditions(
    text: &str,
    line: usize,
    errors: &mut Vec<CompileError>,
) -> Option<[Option<Condition>; MAX_CONDITIONS_PER_RULE]> {
    let mut conditions = [None; MAX_CONDITIONS_PER_RULE];
    if text == "always" {
        return Some(conditions);
    }
    let parts: Vec<&str> = text.split(" and ").collect();
    if parts.len() > MAX_CONDITIONS_PER_RULE {
        push(errors, line, CompileProblem::TooManyConditions);
        return None;
    }
    let mut is_valid = true;
    for (slot, part) in conditions.iter_mut().zip(parts) {
        match compile_comparison(part.trim()) {
            Ok(condition) => *slot = Some(condition),
            Err(problem) => {
                push(errors, line, problem);
                is_valid = false;
            }
        }
    }
    // `then_some(x)` gives `Some(x)` when the bool is true and `None` when it is false.
    is_valid.then_some(conditions)
}

/// The comparison symbols, two-character ones first so `<=` isn't read as `<`.
const COMPARISON_SYMBOLS: [&str; 6] = ["<=", ">=", "==", "!=", "<", ">"];

/// `value op right`, for example `gold_price > 150% base_gold_price`.
fn compile_comparison(text: &str) -> Result<Condition, CompileProblem> {
    for symbol in COMPARISON_SYMBOLS {
        let Some(position) = text.find(symbol) else {
            continue;
        };
        let comparison =
            comparison_from_symbol(symbol).ok_or(CompileProblem::MissingComparison {
                text: text.to_string(),
            })?;
        let value = value_from_name(text[..position].trim())?;
        let right = compile_operand(text[position + symbol.len()..].trim())?;
        return Ok(Condition {
            value,
            comparison,
            right,
        });
    }
    Err(CompileProblem::MissingComparison {
        text: text.to_string(),
    })
}

/// `40` or `150% base_gold_price`.
fn compile_operand(text: &str) -> Result<Operand, CompileProblem> {
    match text.split_once('%') {
        Some((percent, value)) => Ok(Operand::PercentOf {
            percent: parse_number(percent.trim())?,
            value: value_from_name(value.trim())?,
        }),
        None => Ok(Operand::Number(parse_number(text)?)),
    }
}

fn parse_number(text: &str) -> Result<u32, CompileProblem> {
    text.parse().map_err(|_| CompileProblem::BadNumber {
        text: text.to_string(),
    })
}

fn comparison_from_symbol(symbol: &str) -> Option<Comparison> {
    Comparison::ALL
        .into_iter()
        .find(|comparison| comparison.symbol() == symbol)
}

fn value_from_name(name: &str) -> Result<Value, CompileProblem> {
    Value::ALL
        .into_iter()
        .find(|value| value.name() == name)
        .ok_or(CompileProblem::UnknownValue {
            word: name.to_string(),
        })
}

/// `name(arguments)` or a bare `name`, to a `PolicyAction`.
fn compile_action(text: &str) -> Result<PolicyAction, CompileProblem> {
    let (name, arguments) = split_call(text);
    let bad_arguments = || CompileProblem::BadArguments {
        action: name.to_string(),
    };
    let action = match (name, arguments.as_slice()) {
        ("build", [unit]) => PolicyAction::Build(unit_from_name(unit).ok_or_else(bad_arguments)?),
        ("rush", []) => PolicyAction::Rush,
        ("found_city", ["nearest_site"]) => PolicyAction::FoundCity,
        ("claim_tile", ["nearest_deposit"]) => PolicyAction::ClaimTile(TileTarget::NearestDeposit),
        ("claim_tile", ["nearest_free"]) => PolicyAction::ClaimTile(TileTarget::NearestFree),
        ("assign_workers", ["even"]) => PolicyAction::AssignWorkers(None),
        ("assign_workers", [resource]) => PolicyAction::AssignWorkers(Some(
            resource_from_name(resource).ok_or_else(bad_arguments)?,
        )),
        ("sell", [resource, amount]) => PolicyAction::Sell(
            resource_from_name(resource).ok_or_else(bad_arguments)?,
            parse_number(amount)?,
        ),
        ("buy", [resource, amount]) => PolicyAction::Buy(
            resource_from_name(resource).ok_or_else(bad_arguments)?,
            parse_number(amount)?,
        ),
        ("attack", [target]) => compile_attack(target, "capture").ok_or_else(bad_arguments)?,
        ("attack", [target, choice]) => compile_attack(target, choice).ok_or_else(bad_arguments)?,
        (
            "build" | "rush" | "found_city" | "claim_tile" | "assign_workers" | "sell" | "buy"
            | "attack",
            _,
        ) => return Err(bad_arguments()),
        _ => {
            return Err(CompileProblem::UnknownAction {
                name: name.to_string(),
            })
        }
    };
    Ok(action)
}

/// `attack(weakest_neighbor)` or `attack(strongest_neighbor, raze)`.
fn compile_attack(target: &str, choice: &str) -> Option<PolicyAction> {
    let target = match target {
        "weakest_neighbor" => CivTarget::WeakestNeighbor,
        "strongest_neighbor" => CivTarget::StrongestNeighbor,
        _ => return None,
    };
    let choice = match choice {
        "capture" => CityFallChoice::Capture,
        "raze" => CityFallChoice::Raze,
        _ => return None,
    };
    Some(PolicyAction::Attack { target, choice })
}

/// `sell(gold, 20)` to `("sell", ["gold", "20"])`; `rush` and `rush()` to `("rush", [])`.
fn split_call(text: &str) -> (&str, Vec<&str>) {
    let Some((name, rest)) = text.split_once('(') else {
        return (text.trim(), Vec::new());
    };
    let inside = rest.trim_end().strip_suffix(')').unwrap_or(rest);
    let arguments: Vec<&str> = inside
        .split(',')
        .map(str::trim)
        .filter(|argument| !argument.is_empty())
        .collect();
    (name.trim(), arguments)
}

fn unit_from_name(name: &str) -> Option<UnitKind> {
    match name {
        "infantry" => Some(UnitKind::Infantry),
        "guard" => Some(UnitKind::Guard),
        "siege" => Some(UnitKind::Siege),
        "elite" => Some(UnitKind::Elite),
        "settler" => Some(UnitKind::Settler),
        "worker" => Some(UnitKind::Worker),
        _ => None,
    }
}

fn resource_from_name(name: &str) -> Option<Resource> {
    match name {
        "food" => Some(Resource::Food),
        "ore" => Some(Resource::Ore),
        "gold" => Some(Resource::Gold),
        _ => None,
    }
}

fn push(errors: &mut Vec<CompileError>, line: usize, problem: CompileProblem) {
    errors.push(CompileError { line, problem });
}

// Tests live in compiler_tests.rs (see conquest.rs for how `#[path]` works).
#[cfg(test)]
#[path = "compiler_tests.rs"]
mod tests;
