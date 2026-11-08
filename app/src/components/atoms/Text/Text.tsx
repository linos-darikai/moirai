// Text atom: body text in the app's sizes and tones. `mono` is for addresses, hashes and code.

import type { ReactElement, ReactNode } from "react";
import { StyledText } from "./Text.styles";
import type { TextSize, TextTone } from "./Text.styles";

type TextProps = {
  children: ReactNode;
  size?: TextSize;
  tone?: TextTone;
  /** Monospace font (wallets, hashes, turn numbers). */
  isMono?: boolean;
  /** Display font, for big numbers like Elo or tile counts. */
  isDisplay?: boolean;
  weight?: "regular" | "medium" | "semibold" | "bold";
  /** Which element to render; paragraphs by default. */
  as?: "p" | "span" | "strong" | "div";
};

/** A run of text. */
export function Text({
  children,
  size = "base",
  tone = "default",
  isMono = false,
  isDisplay = false,
  weight = "regular",
  as = "p",
}: TextProps): ReactElement {
  return (
    <StyledText as={as} $size={size} $tone={tone} $isMono={isMono} $isDisplay={isDisplay} $weight={weight}>
      {children}
    </StyledText>
  );
}
