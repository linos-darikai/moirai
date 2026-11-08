import styled from "styled-components";

export const HeaderRow = styled.header`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-end;
  gap: ${({ theme }) => theme.space(4)};

  ol {
    margin: 0;
    padding: 0;
    list-style: none;
  }
`;

export const HeaderActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(2.5)};
`;

export const VerifyTitle = styled.h2`
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.successText};
`;
