import styled from "styled-components";

export const HeaderRow = styled.header`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-end;
  gap: ${({ theme }) => theme.space(5)};

  & > div:first-child {
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.space(2.5)};
  }
`;

export const Stats = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space(3)};

  & > * {
    min-width: 140px;
  }
`;

export const SeatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: ${({ theme }) => theme.space(3)};
`;
