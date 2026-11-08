import styled from "styled-components";

export const HeaderRow = styled.header`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space(5)};
`;

export const Identity = styled.div`
  flex: 1 1 300px;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(1.5)};

  & > div {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: ${({ theme }) => theme.space(2.5)};
  }
`;

export const CopyButton = styled.button`
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.radii.md};
  border: ${({ theme }) => theme.borderWidths.sketch} solid ${({ theme }) => theme.colors.borderStrong};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
`;

export const StatGrid = styled.section`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.space(3)};
`;

export const PolicyCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(1.5)};
  padding: ${({ theme }) => theme.space(3)};
  border-radius: ${({ theme }) => theme.radii.xl};
  background: ${({ theme }) => theme.colors.surfaceRaised};
`;

export const PolicyTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
`;

export const RentCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(1)};
  padding: ${({ theme }) => theme.space(3.5)};
  border-radius: ${({ theme }) => theme.radii.xl};
  border: ${({ theme }) => theme.borderWidths.sketch} dashed ${({ theme }) => theme.colors.borderStrong};
`;
