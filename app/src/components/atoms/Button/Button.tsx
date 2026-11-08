// Button atom: an action (<button>) or, when given `to`, a link styled as a button (<Link>).

import type { ReactElement, ReactNode } from "react";
import { Link } from "react-router";
import { StyledButton } from "./Button.styles";
import type { ButtonSize, ButtonVariant } from "./Button.styles";

type ButtonProps = {
  children: ReactNode;
  /** primary = filled accent, secondary = outlined, subtle = raised surface, success = green. */
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Stretch to the container's width. */
  isFullWidth?: boolean;
  /** Renders a router link to this path instead of a button. */
  to?: string;
  onClick?: () => void;
  isDisabled?: boolean;
  /** Accessible name when the visible content is only an icon. */
  ariaLabel?: string;
  /** For toggle buttons: whether it is currently on. */
  isPressed?: boolean;
  type?: "button" | "submit";
};

/** A clickable action or button-styled link. */
export function Button({
  children,
  variant = "primary",
  size = "md",
  isFullWidth = false,
  to,
  onClick,
  isDisabled = false,
  ariaLabel,
  isPressed,
  type = "button",
}: ButtonProps): ReactElement {
  if (to !== undefined) {
    return (
      <StyledButton as={Link} to={to} aria-label={ariaLabel} $variant={variant} $size={size} $isFullWidth={isFullWidth}>
        {children}
      </StyledButton>
    );
  }
  return (
    <StyledButton
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      aria-label={ariaLabel}
      aria-pressed={isPressed}
      $variant={variant}
      $size={size}
      $isFullWidth={isFullWidth}
    >
      {children}
    </StyledButton>
  );
}
