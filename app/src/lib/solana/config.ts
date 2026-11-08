// Cluster settings for the app. The RPC comes from VITE_SOLANA_RPC_URL (see app/.env.example),
// falling back to MagicBlock's devnet RPC, which is far less rate-limited than the public one.

/** Base-layer (devnet) RPC used for every read and transaction. */
export const SOLANA_RPC_URL: string =
  import.meta.env.VITE_SOLANA_RPC_URL ?? "https://rpc.magicblock.app/devnet";

/** Which cluster Solana Explorer links should open. */
export const EXPLORER_CLUSTER = "devnet";

/** Builds a Solana Explorer link for a transaction signature or an address. */
export function explorerUrl(kind: "tx" | "address", value: string): string {
  return `https://explorer.solana.com/${kind}/${value}?cluster=${EXPLORER_CLUSTER}`;
}
