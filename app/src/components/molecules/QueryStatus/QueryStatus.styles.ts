import styled, { css } from "styled-components";

export const Message = styled.p<{ $kind: "loading" | "error" | "empty" }>`
  margin: 0;
  color: ${({ theme, $kind }) => ($kind === "error" ? theme.colors.dangerText : theme.colors.textMuted)};
  ${({ theme, $kind }) =>
    $kind === "empty" &&
    css`
      padding: ${theme.space(8)};
      text-align: center;
      border: 1px dashed ${theme.colors.borderStrong};
      border-radius: ${theme.radii.xxl};
    `}
`;
