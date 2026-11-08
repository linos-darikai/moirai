import styled from "styled-components";

/** Shared look for text fields and selects. */
export const StyledInput = styled.input<{ $isMono: boolean }>`
  width: 100%;
  min-height: ${({ theme }) => theme.sizes.touchTarget};
  padding: 0 ${({ theme }) => theme.space(3.5)};
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  background: ${({ theme }) => theme.colors.inset};
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme, $isMono }) => ($isMono ? theme.fonts.mono : theme.fonts.body)};
  font-size: ${({ theme, $isMono }) => ($isMono ? theme.fontSizes.md : theme.fontSizes.base)};

  &[aria-invalid="true"] {
    border-color: ${({ theme }) => theme.colors.danger};
  }
`;
