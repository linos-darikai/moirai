import styled, { css } from "styled-components";
import type { StepState } from "./StepList";

type Look = "plain" | "progress";

export const List = styled.ol<{ $look: Look }>`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: ${({ theme, $look }) => ($look === "plain" ? theme.space(3.5) : theme.space(1))};
`;

export const Item = styled.li<{ $state: StepState; $look: Look }>`
  display: flex;
  gap: ${({ theme }) => theme.space(3.5)};
  align-items: ${({ $look }) => ($look === "plain" ? "flex-start" : "center")};
  ${({ theme, $look, $state }) =>
    $look === "progress" &&
    css`
      padding: ${theme.space(2.5)} ${theme.space(3)};
      border-radius: ${theme.radii.lg};
      background: ${$state === "current" ? theme.colors.surfaceRaised : "transparent"};
    `}
`;

export const Marker = styled.span<{ $state: StepState; $look: Look }>`
  flex: 0 0 auto;
  width: ${({ $look }) => ($look === "plain" ? "32px" : "28px")};
  height: ${({ $look }) => ($look === "plain" ? "32px" : "28px")};
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme, $look }) => ($look === "plain" ? theme.radii.md : "50%")};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  ${({ theme, $state, $look }) => {
    if ($state === "done") {
      return css`
        background: ${theme.colors.success};
        border: 1px solid ${theme.colors.success};
        color: ${theme.colors.onAccent};
      `;
    }
    if ($state === "current") {
      return css`
        background: ${theme.colors.accent};
        border: 1px solid ${theme.colors.accent};
        color: ${theme.colors.onAccent};
      `;
    }
    return css`
      background: ${$look === "plain" ? theme.colors.surfaceRaised : "transparent"};
      border: 1px solid ${theme.colors.borderStrong};
      color: ${$look === "plain" ? theme.colors.accent : theme.colors.textMuted};
    `;
  }}
`;

export const Words = styled.span`
  display: flex;
  flex-direction: column;
`;

export const Title = styled.strong`
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`;

export const Body = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textMuted};
`;
