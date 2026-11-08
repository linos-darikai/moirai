// Home page placeholder for the scaffold. Becomes the Lobbies screen in Phase 4.

import type { ReactElement } from "react";
import { Link } from "react-router";
import { paths } from "../../routes/paths";

/** Placeholder home page shown until the real Lobbies screen exists. */
export function HomePage(): ReactElement {
  return (
    <main>
      <h1>moirai</h1>
      <p>On-chain bot-arena strategy game. Scaffold only: development starts here.</p>
      <p>
        <Link to={paths.connectionCheck}>Connection check (wallet, devnet program, WASM)</Link>
      </p>
    </main>
  );
}
