//! The compiler's results and error types (docs/decisions/0008). Only built with the `compiler`
//! cargo feature, like compiler.rs.

use std::fmt;

use super::MAX_CONDITIONS_PER_RULE;
use crate::rules::MAX_RULES_PER_POLICY;

/// The longest policy name allowed.
pub const MAX_POLICY_NAME_LENGTH: usize = 32;

/// A compiled policy: its name (shown in the app, not part of the bytes) and the bytes.
#[derive(Clone, PartialEq, Eq, Debug)]
pub struct CompiledPolicy {
    pub name: String,
    pub bytes: Vec<u8>,
}

/// One problem in the YAML, on a line (counted from 1; 0 = the whole policy).
#[derive(Clone, PartialEq, Eq, Debug)]
pub struct CompileError {
    pub line: usize,
    pub problem: CompileProblem,
}

/// What is wrong. `code()` gives a stable short name the app can translate.
#[derive(Clone, PartialEq, Eq, Debug)]
pub enum CompileProblem {
    MissingName,
    NameTooLong,
    NoRules,
    TooManyRules { count: usize },
    UnknownKey { key: String },
    LineOutsideRules,
    UnknownRuleLine,
    DoWithoutIf,
    MissingDo,
    TooManyConditions,
    MissingComparison { text: String },
    UnknownValue { word: String },
    BadNumber { text: String },
    UnknownAction { name: String },
    BadArguments { action: String },
}

impl CompileProblem {
    /// A short stable name for the problem, e.g. `"unknownValue"`.
    pub fn code(&self) -> &'static str {
        match self {
            CompileProblem::MissingName => "missingName",
            CompileProblem::NameTooLong => "nameTooLong",
            CompileProblem::NoRules => "noRules",
            CompileProblem::TooManyRules { .. } => "tooManyRules",
            CompileProblem::UnknownKey { .. } => "unknownKey",
            CompileProblem::LineOutsideRules => "lineOutsideRules",
            CompileProblem::UnknownRuleLine => "unknownRuleLine",
            CompileProblem::DoWithoutIf => "doWithoutIf",
            CompileProblem::MissingDo => "missingDo",
            CompileProblem::TooManyConditions => "tooManyConditions",
            CompileProblem::MissingComparison { .. } => "missingComparison",
            CompileProblem::UnknownValue { .. } => "unknownValue",
            CompileProblem::BadNumber { .. } => "badNumber",
            CompileProblem::UnknownAction { .. } => "unknownAction",
            CompileProblem::BadArguments { .. } => "badArguments",
        }
    }

    /// The word, key or text the problem is about (empty if none), for the app's message.
    pub fn detail(&self) -> String {
        match self {
            CompileProblem::TooManyRules { count } => count.to_string(),
            CompileProblem::UnknownKey { key } => key.clone(),
            CompileProblem::MissingComparison { text } | CompileProblem::BadNumber { text } => {
                text.clone()
            }
            CompileProblem::UnknownValue { word } => word.clone(),
            CompileProblem::UnknownAction { name } => name.clone(),
            CompileProblem::BadArguments { action } => action.clone(),
            _ => String::new(),
        }
    }
}

// `impl fmt::Display` lets `format!("{error}")` print a plain-English message (used by civ-cli
// and tests; the app shows its own translated text from `code()`).
impl fmt::Display for CompileError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        let message = match &self.problem {
            CompileProblem::MissingName => "the policy needs a `name:`".to_string(),
            CompileProblem::NameTooLong => {
                format!("the name is longer than {MAX_POLICY_NAME_LENGTH} characters")
            }
            CompileProblem::NoRules => "the policy has no rules".to_string(),
            CompileProblem::TooManyRules { count } => {
                format!("{count} rules; at most {MAX_RULES_PER_POLICY} are allowed")
            }
            CompileProblem::UnknownKey { key } => format!("unknown key `{key}`"),
            CompileProblem::LineOutsideRules => "indented line outside `rules:`".to_string(),
            CompileProblem::UnknownRuleLine => "expected `- if:` or `do:`".to_string(),
            CompileProblem::DoWithoutIf => "`do:` without an `- if:` before it".to_string(),
            CompileProblem::MissingDo => "this rule has no `do:`".to_string(),
            CompileProblem::TooManyConditions => {
                format!("at most {MAX_CONDITIONS_PER_RULE} conditions joined with `and`")
            }
            CompileProblem::MissingComparison { text } => {
                format!("`{text}` needs a comparison like `<` or `>=`")
            }
            CompileProblem::UnknownValue { word } => format!("unknown value `{word}`"),
            CompileProblem::BadNumber { text } => format!("`{text}` is not a whole number"),
            CompileProblem::UnknownAction { name } => format!("unknown action `{name}`"),
            CompileProblem::BadArguments { action } => format!("wrong arguments for `{action}`"),
        };
        write!(formatter, "line {}: {message}", self.line)
    }
}
