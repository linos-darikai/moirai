// Phase 0 connection check: proves the app can connect a browser wallet on devnet, send
// transactions to the deployed civ program, read its account back, and run the civ-core WASM build.
// Temporary; remove once real pages exist.

import type { ReactElement } from "react";
import { WalletButton } from "../../components/molecules";
import {
  useCounter,
  useCounterAction,
  useEngineDescription,
  useWalletStatus,
} from "../../hooks";
import { CIV_PROGRAM_ID, SOLANA_RPC_URL, explorerUrl } from "../../lib/solana";

/** Route screen for /dev/connection. */
export function ConnectionCheckPage(): ReactElement {
  return (
    <main>
      <h1>Connection check</h1>
      <p>
        Program <code>{CIV_PROGRAM_ID.toBase58()}</code> via <code>{SOLANA_RPC_URL}</code>
      </p>
      <WalletSection />
      <CounterSection />
      <EngineSection />
    </main>
  );
}

/** Step 1: connect a wallet. */
function WalletSection(): ReactElement {
  return (
    <section aria-labelledby="wallet-heading">
      <h2 id="wallet-heading">1. Wallet</h2>
      <WalletButton />
    </section>
  );
}

/** Step 2: create and increment this wallet's Counter on devnet. */
function CounterSection(): ReactElement {
  const wallet = useWalletStatus();
  const counter = useCounter();
  const counterAction = useCounterAction();

  if (!wallet.isConnected) {
    return (
      <section aria-labelledby="counter-heading">
        <h2 id="counter-heading">2. Program</h2>
        <p>Connect a wallet (set to devnet) to talk to the program.</p>
      </section>
    );
  }

  const hasCounter = counter.data !== undefined && counter.data.count !== null;

  return (
    <section aria-labelledby="counter-heading">
      <h2 id="counter-heading">2. Program</h2>

      {counter.isPending && <p>Loading your counter…</p>}
      {counter.isError && <p role="alert">Could not read the counter: {counter.error.message}</p>}
      {counter.data !== undefined && (
        <p>
          Counter <code>{counter.data.address}</code>:{" "}
          {hasCounter ? <strong>{counter.data.count}</strong> : "not created yet"}
        </p>
      )}

      <button
        type="button"
        disabled={counterAction.isPending || counter.isPending}
        onClick={() => counterAction.mutate(hasCounter ? "increment" : "initialize")}
      >
        {hasCounter ? "Increment counter" : "Create counter (initialize)"}
      </button>

      {counterAction.isPending && <p>Waiting for your wallet and the network…</p>}
      {counterAction.isError && (
        <p role="alert">Transaction failed: {counterAction.error.message}</p>
      )}
      {counterAction.data !== undefined && (
        <p>
          Sent:{" "}
          <a href={explorerUrl("tx", counterAction.data)} target="_blank" rel="noreferrer">
            view transaction on Solana Explorer
          </a>
        </p>
      )}
    </section>
  );
}

/** Step 3: run civ-core in the browser through WASM. */
function EngineSection(): ReactElement {
  const engine = useEngineDescription();

  return (
    <section aria-labelledby="engine-heading">
      <h2 id="engine-heading">3. Game engine (WASM)</h2>
      {engine.isPending && <p>Loading the engine…</p>}
      {engine.isError && <p role="alert">Engine failed to load: {engine.error.message}</p>}
      {engine.data !== undefined && (
        <p>
          civ-core says: <code>{engine.data}</code>
        </p>
      )}
    </section>
  );
}
