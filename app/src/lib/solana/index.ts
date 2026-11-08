// Barrel for lib/solana: the only place in the app that talks to Solana. Hooks use these.
export { SolanaProvider } from "./SolanaProvider";
export { SOLANA_RPC_URL, explorerUrl } from "./config";
export { CIV_PROGRAM_ID, createCivProgram, findCounterAddress } from "./civProgram";
export type { CivProgram } from "./civProgram";
