// Browsers don't have Node's global `Buffer`, but the Anchor client (@anchor-lang/core) uses it
// without importing it. This puts the `buffer` package's implementation on `globalThis`.
// main.tsx imports this file FIRST, before anything that loads Anchor or web3.js.

import { Buffer } from "buffer";

if (globalThis.Buffer === undefined) {
  globalThis.Buffer = Buffer;
}
