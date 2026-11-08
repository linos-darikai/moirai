import styled, { css } from "styled-components";
import type { TokenKind } from "../../../model/yamlHighlight";

/** Width of the line-number column. The textarea is indented by the same amount. */
const GUTTER_WIDTH = "56px";

/** Text metrics shared by the coloured layer and the textarea so their letters line up exactly. */
const codeText = css`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: ${({ theme }) => theme.fontSizes.md};
  line-height: ${({ theme }) => theme.lineHeights.code};
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  tab-size: 2;
`;

export const Frame = styled.div`
  border-radius: ${({ theme }) => theme.radii.xxl};
  background: ${({ theme }) => theme.colors.inset};
  border: ${({ theme }) => theme.borderWidths.sketch} solid ${({ theme }) => theme.colors.border};
  overflow: hidden;

  &:focus-within {
    border-color: ${({ theme }) => theme.colors.accent};
  }
`;

export const FileTab = styled.div`
  padding: ${({ theme }) => `${theme.space(2.5)} ${theme.space(4)}`};
  border-bottom: ${({ theme }) => theme.borderWidths.sketch} solid ${({ theme }) => theme.colors.border};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Editor = styled.div`
  position: relative;
  padding: ${({ theme }) => theme.space(3)} 0;
`;

export const CodeLayer = styled.div`
  ${codeText}
`;

export const LineRow = styled.div<{ $isWarning: boolean }>`
  display: flex;
  background: ${({ theme, $isWarning }) => ($isWarning ? theme.colors.warningLine : "transparent")};
  box-shadow: ${({ theme, $isWarning }) => ($isWarning ? `inset 3px 0 0 ${theme.colors.warning}` : "none")};
`;

export const Gutter = styled.span`
  flex: 0 0 ${GUTTER_WIDTH};
  padding-right: ${({ theme }) => theme.space(4)};
  text-align: right;
  color: ${({ theme }) => theme.colors.textSubtle};
  user-select: none;
`;

export const LineText = styled.span`
  flex: 1;
  min-width: 0;
  padding-right: ${({ theme }) => theme.space(4)};
`;

export const TokenSpan = styled.span<{ $kind: TokenKind }>`
  color: ${({ theme, $kind }) => theme.syntaxColors[$kind === "punctuation" ? "punctuation" : $kind]};
`;

export const TypingLayer = styled.textarea`
  ${codeText}
  position: absolute;
  inset: ${({ theme }) => theme.space(3)} 0;
  width: 100%;
  height: calc(100% - ${({ theme }) => theme.space(6)});
  margin: 0;
  padding: 0 ${({ theme }) => theme.space(4)} 0 ${GUTTER_WIDTH};
  border: 0;
  outline: none;
  resize: none;
  overflow: hidden;
  background: transparent;
  color: transparent;
  caret-color: ${({ theme }) => theme.colors.text};

  &::selection {
    background: ${({ theme }) => theme.colors.borderStrong};
    color: transparent;
  }
`;
