// Phase 0 connection check ("/dev/connection"): proves the app can connect a browser wallet on
// devnet, send transactions to the deployed civ program, read its account back, and run the
// civ-core WASM build. Temporary; remove once the real pages talk to the program.

import type { ReactElement } from "react";
import { Button, Heading, Surface, Text } from "../../components/atoms";
import { QueryStatus, WalletButton } from "../../components/molecules";
import { PageContainer } from "../../components/templates";
import {
  useCounter,
  useCounterAction,
  useEngineDescription,
  useOpenWalletPicker,
  useWalletBalance,
  useWalletStatus,
} from "../../hooks";
import { useI18nContext } from "../../i18n";
import { CIV_PROGRAM_ID, SOLANA_RPC_URL, explorerUrl } from "../../lib/solana";
import { initialsFor, shortenAddress } from "../../model/format";
import { profilePath } from "../../routes/paths";

/** Route screen for "/dev/connection". */
export function ConnectionCheckPage(): ReactElement {
  const { LL } = useI18nContext();
  return (
    <PageContainer gap="md">
      <Heading level={1} size="h2">{LL.players.connection.title()}</Heading>
      <Text tone="muted" size="md">
        {LL.players.connection.programVia({ program: CIV_PROGRAM_ID.toBase58(), rpc: SOLANA_RPC_URL })}
      </Text>
      <WalletSection />
      <CounterSection />
      <EngineSection />
    </PageContainer>
  );
}

/** Step 1: connect a wallet. */
function WalletSection(): ReactElement {
  const { LL } = useI18nContext();
  const wallet = useWalletStatus();
  const balance = useWalletBalance();
  const openWalletPicker = useOpenWalletPicker();
  const shortAddress = wallet.address === null ? null : shortenAddress(wallet.address);
  const balanceText = balance.data === undefined ? LL.wallet.balanceLoading() : LL.sol({ amount: balance.data });

  return (
    <Surface as="section" labelledBy="wallet-heading" padding="md">
      <Heading level={2} size="card" id="wallet-heading">{LL.players.connection.walletStep()}</Heading>
      <div>
        <WalletButton
          address={shortAddress}
          balanceText={balanceText}
          initials={initialsFor(wallet.address ?? "")}
          profilePath={profilePath(wallet.address ?? "")}
          connectLabel={LL.wallet.connect()}
          profileLabel={LL.wallet.connected({ address: shortAddress ?? "", balance: balanceText })}
          onConnect={openWalletPicker}
        />
      </div>
    </Surface>
  );
}

/** Step 2: create and increment this wallet's Counter on devnet. */
function CounterSection(): ReactElement {
  const { LL } = useI18nContext();
  const wallet = useWalletStatus();
  const counter = useCounter();
  const counterAction = useCounterAction();
  const text = LL.players.connection;

  if (!wallet.isConnected) {
    return (
      <Surface as="section" labelledBy="counter-heading" padding="md">
        <Heading level={2} size="card" id="counter-heading">{text.programStep()}</Heading>
        <Text>{text.connectFirst()}</Text>
      </Surface>
    );
  }

  const hasCounter = counter.data !== undefined && counter.data.count !== null;
  return (
    <Surface as="section" labelledBy="counter-heading" padding="md">
      <Heading level={2} size="card" id="counter-heading">{text.programStep()}</Heading>
      {counter.isPending && <QueryStatus kind="loading" text={text.loadingCounter()} />}
      {counter.isError && <QueryStatus kind="error" text={text.counterError({ message: counter.error.message })} />}
      {counter.data !== undefined && (
        <Text>
          {text.counter({ address: counter.data.address })}{" "}
          {hasCounter ? <strong>{counter.data.count}</strong> : text.notCreated()}
        </Text>
      )}
      <div>
        <Button
          isDisabled={counterAction.isPending || counter.isPending}
          onClick={() => counterAction.mutate(hasCounter ? "increment" : "initialize")}
        >
          {hasCounter ? text.increment() : text.create()}
        </Button>
      </div>
      {counterAction.isPending && <QueryStatus kind="loading" text={text.waiting()} />}
      {counterAction.isError && <QueryStatus kind="error" text={text.txFailed({ message: counterAction.error.message })} />}
      {counterAction.data !== undefined && (
        <Text>
          {text.sent()}{" "}
          <a href={explorerUrl("tx", counterAction.data)} target="_blank" rel="noreferrer">
            {text.viewTx()}
          </a>
        </Text>
      )}
    </Surface>
  );
}

/** Step 3: run civ-core in the browser through WASM. */
function EngineSection(): ReactElement {
  const { LL } = useI18nContext();
  const engine = useEngineDescription();
  const text = LL.players.connection;
  return (
    <Surface as="section" labelledBy="engine-heading" padding="md">
      <Heading level={2} size="card" id="engine-heading">{text.engineStep()}</Heading>
      {engine.isPending && <QueryStatus kind="loading" text={text.loadingEngine()} />}
      {engine.isError && <QueryStatus kind="error" text={text.engineError({ message: engine.error.message })} />}
      {engine.data !== undefined && (
        <Text>
          {text.engineSays()} <Text as="span" isMono>{engine.data}</Text>
        </Text>
      )}
    </Surface>
  );
}
