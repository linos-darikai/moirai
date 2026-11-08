import styled, { css, keyframes } from "styled-components";

// One 6-second loop: the infantry marches right (0-40%), shakes against the tower (40-56%), the
// tower flickers out, a cross is drawn over it and "+1 tile!" pops up, then everything resets.
// The percentages line up across the keyframes so the beats happen together.

const march = keyframes`
  0% { transform: translateX(0); opacity: 0; }
  6% { opacity: 1; }
  40% { transform: translateX(232px); }
  44% { transform: translateX(214px); }
  48% { transform: translateX(236px); }
  52% { transform: translateX(220px); }
  56%, 88% { transform: translateX(232px); opacity: 1; }
  95%, 100% { transform: translateX(232px); opacity: 0; }
`;

const towerHit = keyframes`
  0%, 40% { opacity: 1; transform: translate(0, 0); }
  44% { transform: translate(5px, -3px); }
  48% { transform: translate(-5px, 2px); }
  52% { transform: translate(4px, 1px); }
  56% { transform: translate(0, 0); opacity: 1; }
  70%, 92% { opacity: 0.14; }
  100% { opacity: 1; }
`;

const burst = keyframes`
  0%, 40% { opacity: 0; transform: scale(0.4); }
  46% { opacity: 1; transform: scale(1.15); }
  58% { opacity: 1; transform: scale(0.9); }
  68%, 100% { opacity: 0; transform: scale(0.5); }
`;

/** The cross "draws itself" by shrinking the gap in a long dash. */
const drawCross = keyframes`
  0%, 54% { stroke-dashoffset: 240; opacity: 1; }
  68%, 88% { stroke-dashoffset: 0; opacity: 1; }
  95%, 100% { stroke-dashoffset: 0; opacity: 0; }
`;

const trail = keyframes`
  0% { opacity: 0; }
  30%, 88% { opacity: 0.55; }
  96%, 100% { opacity: 0; }
`;

const tileWon = keyframes`
  0%, 62% { opacity: 0; transform: translateY(8px); }
  70%, 88% { opacity: 1; transform: translateY(0); }
  96%, 100% { opacity: 0; }
`;

const bob = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
`;

/** Animations only run when the visitor hasn't asked for reduced motion. */
function whenMotionIsOk(rules: ReturnType<typeof css>): ReturnType<typeof css> {
  return css`
    @media (prefers-reduced-motion: no-preference) {
      ${rules}
    }
  `;
}

export const Canvas = styled.svg`
  display: block;
  width: 100%;
  height: auto;

  /* Scale and shake around each shape's own centre, not the canvas corner. */
  .tower,
  .burst {
    transform-box: fill-box;
    transform-origin: center;
  }

  /* Hidden until their moment in the loop. */
  .burst,
  .cross,
  .tile-won {
    opacity: 0;
  }

  .cross {
    stroke-dasharray: 240;
    stroke-dashoffset: 240;
  }

  ${whenMotionIsOk(css`
    .infantry { animation: ${march} 6s ease-in-out infinite; }
    .tower { animation: ${towerHit} 6s linear infinite; }
    .burst { animation: ${burst} 6s ease-out infinite; }
    .cross { animation: ${drawCross} 6s ease-in-out infinite; }
    .trail { animation: ${trail} 6s linear infinite; }
    .tile-won { animation: ${tileWon} 6s ease-out infinite; }
    .capital { animation: ${bob} 2.4s ease-in-out infinite; }
  `)}
`;

/**
 * Note sizes in SVG canvas units, not page pixels: they scale with the 520-wide drawing, so they
 * are tied to the artwork's coordinates and deliberately don't come from the theme's type scale.
 */
const NOTE_CANVAS_SIZE = { note: "26px", big: "30px" } as const;

/** Handwritten notes on the drawing. */
export const Note = styled.text<{ $size: "note" | "big" }>`
  font-family: ${({ theme }) => theme.fonts.hand};
  font-size: ${({ $size }) => NOTE_CANVAS_SIZE[$size]};
  font-weight: ${({ theme, $size }) => ($size === "big" ? theme.fontWeights.bold : theme.fontWeights.regular)};
`;
