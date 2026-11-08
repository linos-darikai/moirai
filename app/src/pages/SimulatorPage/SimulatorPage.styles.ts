import styled from "styled-components";

export const HeaderRow = styled.header`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-end;
  gap: ${({ theme }) => theme.space(4)};
`;

export const EngineBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  padding: ${({ theme }) => `${theme.space(1.5)} ${theme.space(3)}`};
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1px solid ${({ theme }) => theme.colors.border};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};

  &::before {
    content: "";
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.success};
  }
`;

/** The board on the left, the standings/chart/rules panels on the right; stacks on phones. */
export const Panels = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(6)};

  & > div:first-child {
    flex: 1 1 460px;
    max-width: 600px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.space(3)};
  }

  & > div:last-child {
    flex: 1 1 300px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.space(4)};
  }

  ol,
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.space(2.5)};
  }

  fieldset {
    margin: 0;
    padding: 0;
    border: 0;
  }
`;

export const OpponentRow = styled.label`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2.5)};
  min-height: ${({ theme }) => theme.sizes.touchTarget};
  margin-bottom: ${({ theme }) => theme.space(2)};
  padding: 0 ${({ theme }) => theme.space(3)};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surfaceRaised};
  cursor: pointer;

  input {
    width: 18px;
    height: 18px;
    accent-color: ${({ theme }) => theme.colors.accent};
  }

  & > span:nth-of-type(2) {
    flex: 1;
  }
`;
