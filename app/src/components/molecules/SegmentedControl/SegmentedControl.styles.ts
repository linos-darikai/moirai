import styled, { css } from "styled-components";

type Shape = "segmented" | "pills";

export const Group = styled.div<{ $shape: Shape; $isFullWidth: boolean }>`
  display: ${({ $isFullWidth }) => ($isFullWidth ? "flex" : "inline-flex")};
  flex-wrap: wrap;
  gap: ${({ theme, $shape }) => ($shape === "pills" ? theme.space(2) : "0")};
  ${({ theme, $shape }) =>
    $shape === "segmented" &&
    css`
      padding: ${theme.space(1)};
      border-radius: ${theme.radii.lg};
      background: ${theme.colors.inset};
      border: 1px solid ${theme.colors.border};
    `}
`;

export const Segment = styled.button<{ $isOn: boolean; $shape: Shape; $isFullWidth: boolean }>`
  flex: ${({ $isFullWidth }) => ($isFullWidth ? "1" : "0 0 auto")};
  min-height: ${({ $shape }) => ($shape === "pills" ? "40px" : "36px")};
  min-width: 44px;
  padding: 0 ${({ theme }) => theme.space(4)};
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme, $shape }) => ($shape === "pills" ? theme.fontWeights.medium : theme.fontWeights.semibold)};
  cursor: pointer;
  background: ${({ theme, $isOn, $shape }) =>
    $isOn ? theme.colors.accent : $shape === "pills" ? theme.colors.surface : "transparent"};
  color: ${({ theme, $isOn }) => ($isOn ? theme.colors.onAccent : theme.colors.text)};
  border: ${({ theme, $isOn, $shape }) =>
    $shape === "pills" ? `1px solid ${$isOn ? theme.colors.accent : theme.colors.borderStrong}` : "0"};
  border-radius: ${({ theme, $shape }) => ($shape === "pills" ? theme.radii.pill : theme.radii.md)};
`;
