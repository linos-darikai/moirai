import styled from "styled-components";

export const Card = styled.article`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(4)};
  padding: ${({ theme }) => theme.space(5)};
  border-radius: ${({ theme }) => theme.radii.xxl};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

export const TopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
`;

export const Fee = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: ${({ theme }) => theme.space(2)};
`;

export const Seats = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(1.5)};
`;
