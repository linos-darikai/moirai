//! Compiled policy bytes (docs/decisions/0008, "Compiled bytes"). These are what a player commits
//! to (as `sha256(bytes || salt)`), reveals, and what the program runs every turn.
//!
//! Layout: a 3-byte header (`b'M'`, format version, rule count), then one fixed 31-byte block per
//! rule: a condition count, 3 condition slots of 8 bytes, and a 6-byte action. Fixed sizes mean
//! the interpreter reads rule `i` straight from offset `3 + 31 × i`, with no parsing.
//!
//! Every byte is checked by `validate_policy`, including that unused slots are zero, so the same
//! policy always has exactly one byte form (and one commitment).

use super::{
    byte_of, item_of, AttackObjective, CivTarget, Comparison, Condition, Operand, PolicyAction,
    Rule, TileTarget, Value, MAX_CONDITIONS_PER_RULE,
};
use crate::conquest::CityFallChoice;
use crate::resources::Resource;
use crate::rules::MAX_RULES_PER_POLICY;
use crate::units::UnitKind;

/// First byte of every compiled policy ("M" for moirai).
pub const POLICY_MAGIC: u8 = b'M';
/// The byte format version this code reads and writes.
pub const POLICY_FORMAT_VERSION: u8 = 1;
/// Bytes before the first rule.
pub const HEADER_BYTES: usize = 3;
/// Bytes per condition slot.
pub const CONDITION_BYTES: usize = 8;
/// Bytes per action.
pub const ACTION_BYTES: usize = 6;
/// Bytes per rule: count + condition slots + action.
pub const RULE_BYTES: usize = 1 + CONDITION_BYTES * MAX_CONDITIONS_PER_RULE + ACTION_BYTES;
/// The largest compiled policy: 3 + 16 × 31 = 499 bytes.
pub const MAX_POLICY_BYTES: usize = HEADER_BYTES + RULE_BYTES * MAX_RULES_PER_POLICY;

/// Why compiled bytes are not a valid policy.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum PolicyFormatError {
    /// Doesn't start with `b'M'`.
    NotAPolicy,
    /// Written by a format version this code doesn't read.
    UnsupportedVersion,
    /// The rule count is 0 or more than MAX_RULES_PER_POLICY.
    BadRuleCount,
    /// The length doesn't match the rule count.
    WrongLength,
    /// This rule (counted from 0) has a condition that can't be read.
    BadCondition { rule: usize },
    /// This rule (counted from 0) has an action that can't be read.
    BadAction { rule: usize },
}

/// Checks every byte of a compiled policy. Returns how many rules it has.
pub fn validate_policy(bytes: &[u8]) -> Result<usize, PolicyFormatError> {
    let rule_count = read_header(bytes)?;
    for index in 0..rule_count {
        let block = rule_block(bytes, index).ok_or(PolicyFormatError::WrongLength)?;
        decode_rule(block, index)?;
    }
    Ok(rule_count)
}

/// Rule `index` of a policy that `validate_policy` accepted. `None` if out of range or invalid.
pub fn read_rule(bytes: &[u8], index: usize) -> Option<Rule> {
    let block = rule_block(bytes, index)?;
    decode_rule(block, index).ok()
}

/// The rule count from the header, after checking the header and the total length.
fn read_header(bytes: &[u8]) -> Result<usize, PolicyFormatError> {
    let (Some(&magic), Some(&version), Some(&count)) = (bytes.first(), bytes.get(1), bytes.get(2))
    else {
        return Err(PolicyFormatError::WrongLength);
    };
    if magic != POLICY_MAGIC {
        return Err(PolicyFormatError::NotAPolicy);
    }
    if version != POLICY_FORMAT_VERSION {
        return Err(PolicyFormatError::UnsupportedVersion);
    }
    let rule_count = usize::from(count);
    if rule_count == 0 || rule_count > MAX_RULES_PER_POLICY {
        return Err(PolicyFormatError::BadRuleCount);
    }
    if bytes.len() != HEADER_BYTES + RULE_BYTES * rule_count {
        return Err(PolicyFormatError::WrongLength);
    }
    Ok(rule_count)
}

/// The 31 bytes of rule `index`, if they are there.
fn rule_block(bytes: &[u8], index: usize) -> Option<&[u8]> {
    let start = HEADER_BYTES.checked_add(RULE_BYTES.checked_mul(index)?)?;
    bytes.get(start..start.checked_add(RULE_BYTES)?)
}

/// Reads one rule block.
fn decode_rule(block: &[u8], index: usize) -> Result<Rule, PolicyFormatError> {
    let bad_condition = PolicyFormatError::BadCondition { rule: index };
    let condition_count = usize::from(*block.first().ok_or(bad_condition)?);
    if condition_count > MAX_CONDITIONS_PER_RULE {
        return Err(bad_condition);
    }

    let mut conditions = [None; MAX_CONDITIONS_PER_RULE];
    for (slot, condition) in conditions.iter_mut().enumerate() {
        let start = 1 + slot * CONDITION_BYTES;
        let bytes = block
            .get(start..start + CONDITION_BYTES)
            .ok_or(bad_condition)?;
        if slot < condition_count {
            *condition = Some(decode_condition(bytes).ok_or(bad_condition)?);
        } else if bytes.iter().any(|byte| *byte != 0) {
            return Err(bad_condition); // unused slots must be all zero
        }
    }

    let action_start = 1 + CONDITION_BYTES * MAX_CONDITIONS_PER_RULE;
    let action_bytes = block
        .get(action_start..action_start + ACTION_BYTES)
        .ok_or(PolicyFormatError::BadAction { rule: index })?;
    let action = decode_action(action_bytes).ok_or(PolicyFormatError::BadAction { rule: index })?;
    Ok(Rule { conditions, action })
}

/// Reads an 8-byte condition: value, comparison, right kind, right value, u32.
fn decode_condition(bytes: &[u8]) -> Option<Condition> {
    let value = item_of(*bytes.first()?, &Value::ALL)?;
    let comparison = item_of(*bytes.get(1)?, &Comparison::ALL)?;
    let number = read_u32(bytes.get(4..8)?)?;
    let right = match (*bytes.get(2)?, *bytes.get(3)?) {
        (0, 0) => Operand::Number(number),
        (1, value_byte) => Operand::PercentOf {
            percent: number,
            value: item_of(value_byte, &Value::ALL)?,
        },
        _ => return None,
    };
    Some(Condition {
        value,
        comparison,
        right,
    })
}

/// Reads a 6-byte action: kind, argument byte, u32. Unused parts must be zero.
fn decode_action(bytes: &[u8]) -> Option<PolicyAction> {
    let kind = *bytes.first()?;
    let argument = *bytes.get(1)?;
    let number = read_u32(bytes.get(2..6)?)?;
    let action = match kind {
        1 => PolicyAction::Build(UnitKind::from_byte(argument)?),
        2 => PolicyAction::Rush,
        3 => PolicyAction::FoundCity,
        4 => PolicyAction::ClaimTile(tile_target_from_byte(argument)?),
        5 => PolicyAction::AssignWorkers(worker_focus_from_byte(argument)?),
        6 => PolicyAction::Sell(Resource::from_byte(argument)?, number),
        7 => PolicyAction::Buy(Resource::from_byte(argument)?, number),
        8 => {
            // The number packs both choices: raze + 2 × objective (docs/decisions/0010).
            let objective = AttackObjective::ALL
                .get(usize::try_from(number / 2).ok()?)
                .copied()?;
            PolicyAction::Attack {
                target: item_of(argument, &CivTarget::ALL)?,
                objective,
                choice: fall_choice_from_number(number % 2)?,
            }
        }
        _ => return None,
    };
    // Only actions that use the number may have one; only some use the argument byte.
    let uses_number = matches!(
        action,
        PolicyAction::Sell(..) | PolicyAction::Buy(..) | PolicyAction::Attack { .. }
    );
    let uses_argument = !matches!(action, PolicyAction::Rush | PolicyAction::FoundCity);
    if (!uses_number && number != 0) || (!uses_argument && argument != 0) {
        return None;
    }
    Some(action)
}

/// A little-endian u32 from exactly 4 bytes.
fn read_u32(bytes: &[u8]) -> Option<u32> {
    let array: [u8; 4] = bytes.try_into().ok()?;
    Some(u32::from_le_bytes(array))
}

fn tile_target_from_byte(byte: u8) -> Option<TileTarget> {
    match byte {
        1 => Some(TileTarget::NearestDeposit),
        2 => Some(TileTarget::NearestFree),
        _ => None,
    }
}

/// Worker focus: 0 = even (`Some(None)`), 1..=3 = a resource, anything else invalid (`None`).
fn worker_focus_from_byte(byte: u8) -> Option<Option<Resource>> {
    if byte == 0 {
        return Some(None);
    }
    Resource::from_byte(byte).map(Some)
}

fn fall_choice_from_number(number: u32) -> Option<CityFallChoice> {
    match number {
        0 => Some(CityFallChoice::Capture),
        1 => Some(CityFallChoice::Raze),
        _ => None,
    }
}

/// Writes a policy's rules as compiled bytes (the compiler and tests use this).
pub fn encode_policy(rules: &[Rule]) -> Result<Vec<u8>, PolicyFormatError> {
    let rule_count = u8::try_from(rules.len()).map_err(|_| PolicyFormatError::BadRuleCount)?;
    if rules.is_empty() || rules.len() > MAX_RULES_PER_POLICY {
        return Err(PolicyFormatError::BadRuleCount);
    }
    let mut bytes = vec![POLICY_MAGIC, POLICY_FORMAT_VERSION, rule_count];
    for rule in rules {
        bytes.extend_from_slice(&encode_rule(rule));
    }
    Ok(bytes)
}

/// One rule as its 31-byte block.
pub fn encode_rule(rule: &Rule) -> [u8; RULE_BYTES] {
    let mut block = [0u8; RULE_BYTES];
    let mut condition_count: u8 = 0;
    for (slot, condition) in rule.conditions.iter().flatten().enumerate() {
        let start = 1 + slot * CONDITION_BYTES;
        if let Some(target) = block.get_mut(start..start + CONDITION_BYTES) {
            target.copy_from_slice(&encode_condition(condition));
            condition_count += 1;
        }
    }
    block[0] = condition_count;
    let action_start = 1 + CONDITION_BYTES * MAX_CONDITIONS_PER_RULE;
    if let Some(target) = block.get_mut(action_start..) {
        target.copy_from_slice(&encode_action(&rule.action));
    }
    block
}

fn encode_condition(condition: &Condition) -> [u8; CONDITION_BYTES] {
    let (right_kind, right_value, number) = match condition.right {
        Operand::Number(number) => (0, 0, number),
        Operand::PercentOf { percent, value } => (1, byte_of(value, &Value::ALL), percent),
    };
    let number_bytes = number.to_le_bytes();
    [
        byte_of(condition.value, &Value::ALL),
        byte_of(condition.comparison, &Comparison::ALL),
        right_kind,
        right_value,
        number_bytes[0],
        number_bytes[1],
        number_bytes[2],
        number_bytes[3],
    ]
}

fn encode_action(action: &PolicyAction) -> [u8; ACTION_BYTES] {
    let (kind, argument, number): (u8, u8, u32) = match *action {
        PolicyAction::Build(unit) => (1, unit.to_byte(), 0),
        PolicyAction::Rush => (2, 0, 0),
        PolicyAction::FoundCity => (3, 0, 0),
        PolicyAction::ClaimTile(TileTarget::NearestDeposit) => (4, 1, 0),
        PolicyAction::ClaimTile(TileTarget::NearestFree) => (4, 2, 0),
        PolicyAction::AssignWorkers(focus) => (5, focus.map_or(0, Resource::to_byte), 0),
        PolicyAction::Sell(resource, amount) => (6, resource.to_byte(), amount),
        PolicyAction::Buy(resource, amount) => (7, resource.to_byte(), amount),
        PolicyAction::Attack {
            target,
            objective,
            choice,
        } => {
            let raze = match choice {
                CityFallChoice::Capture => 0,
                CityFallChoice::Raze => 1,
            };
            let objective_number =
                u32::from(byte_of(objective, &AttackObjective::ALL)).saturating_sub(1);
            (
                8,
                byte_of(target, &CivTarget::ALL),
                raze + 2 * objective_number,
            )
        }
    };
    let number_bytes = number.to_le_bytes();
    [
        kind,
        argument,
        number_bytes[0],
        number_bytes[1],
        number_bytes[2],
        number_bytes[3],
    ]
}

// Tests live in format_tests.rs (see conquest.rs for how `#[path]` works).
#[cfg(test)]
#[path = "format_tests.rs"]
mod tests;
