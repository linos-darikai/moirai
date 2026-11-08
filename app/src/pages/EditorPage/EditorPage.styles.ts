import styled, { css } from "styled-components";

export const PolicyList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(1.5)};
`;

export const TemplateRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(2)};
`;

export const RuleList = styled.ol`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(2.5)};
`;

export const RuleItem = styled.li<{ $isWarning: boolean }>`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)};
  padding: ${({ theme }) => `${theme.space(3.5)} ${theme.space(4)}`};
  border-radius: ${({ theme }) => theme.radii.xl};
  background: ${({ theme }) => theme.colors.surface};
  border: ${({ theme }) => theme.borderWidths.sketch} solid ${({ theme, $isWarning }) => ($isWarning ? theme.colors.highlight : theme.colors.sketchLine)};
`;

export const Chip = styled.span<{ $tone: "condition" | "action" }>`
  padding: ${({ theme }) => `${theme.space(0.75)} ${theme.space(2)}`};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  ${({ theme, $tone }) =>
    $tone === "condition"
      ? css`
          border: ${theme.borderWidths.thin} solid ${theme.colors.border};
          color: ${theme.colors.text};
        `
      : css`
          border: ${theme.borderWidths.thin} solid ${theme.colors.actionText};
          color: ${theme.colors.actionText};
        `}
`;

export const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(1.5)};
`;

export const Notice = styled.div<{ $isError: boolean }>`
  display: flex;
  gap: ${({ theme }) => theme.space(3)};
  align-items: flex-start;
  padding: ${({ theme }) => `${theme.space(3)} ${theme.space(4)}`};
  border-radius: ${({ theme }) => theme.radii.xl};
  font-size: ${({ theme }) => theme.fontSizes.md};
  ${({ theme, $isError }) =>
    $isError
      ? css`
          color: ${theme.colors.dangerText};
          border: ${theme.borderWidths.sketch} dashed ${theme.colors.danger};
        `
      : css`
          color: ${theme.colors.warningText};
          border: ${theme.borderWidths.sketch} dashed ${theme.colors.highlight};
        `}
`;

export const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.space(2.5)};
`;

export const CheckList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(2)};
  font-size: ${({ theme }) => theme.fontSizes.md};
`;

/** A check line with a ✓ (ok) or ! (problem) mark drawn by CSS, so the text stays translatable. */
export const Check = styled.li<{ $isOk: boolean; $isWarning?: boolean }>`
  display: flex;
  gap: ${({ theme }) => theme.space(2)};
  align-items: center;

  &::before {
    content: "${({ $isOk }) => ($isOk ? "✓" : "!")}";
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    color: ${({ theme, $isOk, $isWarning }) =>
      $isOk ? theme.colors.success : $isWarning === true ? theme.colors.warning : theme.colors.danger};
  }
`;
