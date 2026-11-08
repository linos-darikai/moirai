import styled from "styled-components";

export const List = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => `${theme.space(2)} ${theme.space(4.5)}`};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Item = styled.li`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(1.5)};
`;

/** A 16 px box that the legend's hand-drawn marks fill. */
export const MarkSlot = styled.span`
  flex: 0 0 auto;
  width: 16px;
  height: 16px;
`;

export const ContestedMark = styled.span`
  width: 12px;
  height: 12px;
  border-radius: ${({ theme }) => theme.radii.xs};
  box-shadow: inset 0 0 0 2px ${({ theme }) => theme.colors.highlight};
`;
