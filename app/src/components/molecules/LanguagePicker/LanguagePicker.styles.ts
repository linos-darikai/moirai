import styled from "styled-components";

export const Wrapper = styled.div`
  width: 150px;

  select {
    min-height: 40px;
    border-radius: ${({ theme }) => theme.radii.xl};
  }
`;
