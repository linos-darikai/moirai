import styled from "styled-components";

export const Fieldset = styled.fieldset`
  margin: 0;
  min-width: 0;
  padding: ${({ theme }) => theme.space(6)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.card};
  background: ${({ theme }) => theme.colors.surface};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(4)};
`;

export const Legend = styled.legend`
  padding: 0 ${({ theme }) => theme.space(2)};
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

export const ChoiceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: ${({ theme }) => theme.space(3)};
`;

export const FieldRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.space(4)};

  & > div {
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.space(2)};
  }
`;
