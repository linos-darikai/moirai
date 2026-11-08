import styled from "styled-components";

export const Page = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(4)};
  padding: ${({ theme }) => `${theme.space(4)} ${theme.space(4)} ${theme.space(10)}`};

  ${({ theme }) => theme.media.desktop} {
    padding: ${({ theme }) => `${theme.space(7)} ${theme.space(6)} ${theme.space(10)}`};
  }
`;

/** The big frame: grows to fill the row, never narrower than its content allows. */
export const Frame = styled.div`
  flex: 999 1 720px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(7)};
  padding: ${({ theme }) => `${theme.space(6)} ${theme.space(4)}`};
  border: ${({ theme }) => theme.borderWidths.pen} solid ${({ theme }) => theme.colors.sketchLine};
  border-radius: ${({ theme }) => theme.radii.sketchPage};

  ${({ theme }) => theme.media.desktop} {
    padding: ${({ theme }) => `${theme.space(8)} ${theme.space(10)} ${theme.space(7)}`};
  }
`;

/** On wide screens the tab is a 72 px column; on phones it wraps under the frame at full width. */
export const Tab = styled.div`
  flex: 1 1 72px;
  display: flex;

  ${({ theme }) => theme.media.desktop} {
    flex: 0 0 72px;
  }
`;
