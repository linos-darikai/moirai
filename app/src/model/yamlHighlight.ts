// Splits policy YAML lines into coloured pieces for the editor (same colours as the design):
// keys blue, numbers gold, actions teal, and/or/not/always purple, operators orange.

/** What a piece of text is, which picks its colour token. */
export type TokenKind = "plain" | "key" | "number" | "call" | "keyword" | "operator" | "punctuation";

export type Token = { text: string; kind: TokenKind };

const LINE_SHAPE = /^(\s*)(- )?([a-z_]+:)?(.*)$/;
const KEYWORDS = /^(and|or|not|always)$/;
const OPERATORS = /^(<|>|<=|>=|==|!=|\*)$/;
const NUMBER = /^\d+%?$/;

/** The kind of one word in a condition or action. */
function kindOfWord(word: string): TokenKind {
  if (NUMBER.test(word)) return "number";
  if (word.includes("(")) return "call";
  if (KEYWORDS.test(word)) return "keyword";
  if (OPERATORS.test(word)) return "operator";
  return "plain";
}

/** Splits one line of YAML into coloured tokens. Joining the tokens' text gives the line back. */
export function highlightYamlLine(line: string): Token[] {
  const match = LINE_SHAPE.exec(line);
  if (match === null) return [{ text: line, kind: "plain" }];

  const [, indent = "", dash = "", key = "", rest = ""] = match;
  const tokens: Token[] = [];
  if (indent !== "") tokens.push({ text: indent, kind: "plain" });
  if (dash !== "") tokens.push({ text: dash, kind: "punctuation" });
  if (key !== "") tokens.push({ text: key, kind: "key" });

  for (const piece of rest.split(/(\s+)/)) {
    if (piece === "") continue;
    tokens.push({ text: piece, kind: /^\s+$/.test(piece) ? "plain" : kindOfWord(piece) });
  }
  return tokens;
}
