import styled from "styled-components";

export const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(2)};
  min-width: 0;
`;

export const LabelRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: ${({ theme }) => theme.space(3)};
`;

export const FieldLabel = styled.label`
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

export const Hint = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;
