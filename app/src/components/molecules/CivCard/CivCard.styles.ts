import styled from "styled-components";

export const Card = styled.article<{ $isYou: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(2.5)};
  padding: ${({ theme }) => theme.space(3.5)};
  border-radius: ${({ theme }) => theme.radii.xxl};
  background: ${({ theme }) => theme.colors.surface};
  border: ${({ theme }) => theme.borderWidths.sketch} solid ${({ theme, $isYou }) => ($isYou ? theme.colors.highlight : theme.colors.sketchLine)};
`;

export const Header = styled.div`
  display: grid;
  grid-template-columns: 16px auto 1fr auto;
  align-items: center;
  gap: ${({ theme }) => theme.space(2.5)};
`;

export const Resources = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${({ theme }) => theme.space(1.5)};
`;

export const Units = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};

  & > :last-child {
    margin-left: auto;
  }
`;

export const UnitCount = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(1)};
`;
