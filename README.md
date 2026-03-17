# initia.js

TypeScript SDK for Initia and its rollup ecosystem.

## Features

- Multi-VM support: Move, EVM, and CosmWasm contracts in one SDK
- Type-safe gRPC client with Proxy-based service access
- Typed context factories: `createInitiaContext`, `createMinievmContext`, `createMiniwasmContext`, `createMinimoveContext`
- VM-agnostic token abstraction (Fungible Asset, ERC20, CW20)
- OP Bridge and Router API for L1/L2 cross-chain transfers
- Automatic Amino conversion via proto schema options
- Transaction decoding with VM-aware arg enrichment (`ctx.getTx()`)
- ABI-driven contracts: BCS (Move), `abitype` (EVM), JSON schema (CosmWasm)
- CometBFT HTTP RPC client (23 endpoints) and EVM JSON-RPC client
- Signer bridge adapters for viem and ethers.js interop
- Cosmos chain-registry integration (Osmosis, Noble, etc.)
- Browser-native with gRPC-Web transport, zero Node.js polyfills
- WebSocket subscriptions and event parsing
- Codegen CLI (`npx abigen`) for Move, EVM, and CosmWasm ABIs
- tree-shakeable subpath exports

## Supported Environments

| Environment | Version | Transport |
|-------------|---------|-----------|
| Node.js | >= 22 | Native gRPC (HTTP/2) |
| Browser | Modern | gRPC-Web |
| Bun | >= 1.0 | Native gRPC (HTTP/2) |

## Installation

```bash
npm install initia.js
```

All proto dependencies (`@initia/initia-proto`, `@initia/minievm-proto`, `@initia/miniwasm-proto`, `@initia/opinit-proto`) are bundled as regular dependencies — no registry configuration needed.

### Proto packages

Proto type definitions are published as separate npm packages rather than bundled into the SDK. This allows teams that fork Minievm, Minimove, or Miniwasm to swap proto packages without forking initia.js itself:

```json
{
  "dependencies": {
    "@initia/minievm-proto": "npm:@mychain/myevm-proto@^1.0.0"
  }
}
```

## Quick Start

### Query balance

```typescript
import { createInitiaContext } from 'initia.js'

const ctx = await createInitiaContext({ network: 'mainnet' })

const { balance } = await ctx.client.bank.balance({
  address: 'init1...',
  denom: 'uinit',
})
console.log(balance?.amount)
```

### Send tokens

```typescript
import { createInitiaContext, MnemonicKey, coin } from 'initia.js'

const key = new MnemonicKey({ mnemonic: 'your mnemonic ...' })
const ctx = await createInitiaContext({ network: 'mainnet', signer: key })

const result = await ctx.signAndBroadcast([
  ctx.msgs.bank.send({
    fromAddress: ctx.address,
    toAddress: 'init1recipient...',
    amount: [coin('uinit', '1000000')],
  }),
])
console.log(result.txHash)
```

### Move contract call

```typescript
import { createMoveContract } from 'initia.js/move'

const coin = await createMoveContract(ctx, '0x1', 'coin')

const balance = await coin.view.balance({
  typeArgs: ['0x1::native_uinit::Coin'],
  args: ['init1owner...'],
})
const msg = coin.execute.transfer(ctx.address, {
  typeArgs: ['0x1::native_uinit::Coin'],
  args: ['init1recipient...', '1000000'],
})
await ctx.signAndBroadcast([msg])
```

### EVM contract call

```typescript
import { createEvmContract, type Abi } from 'initia.js/evm'

const abi = [/* ERC-20 ABI */] as const satisfies Abi
const erc20 = createEvmContract(ctx, '0xContractAddress', abi)

const balance = await erc20.read.balanceOf('0xOwner')
const msg = erc20.write.transfer(ctx.address, '0xRecipient', 1000n)
await ctx.signAndBroadcast([msg])
```

### CometBFT RPC

The `ctx.rpc` accessor provides a CometBFT HTTP RPC client covering 23 endpoints not available via gRPC. It is lazily initialized and automatically inherits `auth`, `headers`, and `timeoutMs` from the context. All methods accept per-request option overrides.

**Endpoints by category:** blocks & headers (`block`, `blockByHash`, `blockResults`, `header`, `headerByHash`, `blockchain`, `blockSearch`), transactions (`tx`, `txSearch`, `unconfirmedTxs`, `numUnconfirmedTxs`), consensus (`validators`, `commit`, `consensusParams`, `consensusState`, `dumpConsensusState`), node (`status`, `health`, `netInfo`, `genesis`, `genesisChunked`), ABCI (`abciInfo`, `abciQuery`).

```typescript
import { createInitiaContext } from 'initia.js'

const ctx = await createInitiaContext({
  network: 'mainnet',
  auth: { type: 'api-key', key: 'my-key' },
  timeoutMs: 5000,
})

// CometBFT RPC — auth/headers/timeoutMs forwarded automatically
const blockResult = await ctx.rpc.blockResults(100)
const txResult = await ctx.rpc.tx('A1B2C3...')
const searchResult = await ctx.rpc.txSearch("message.action='/cosmos.bank.v1beta1.MsgSend'")
const status = await ctx.rpc.status()
const healthy = await ctx.rpc.health() // true/false, never throws
```

For minievm chains, `ctx.evmRpc` provides an Ethereum JSON-RPC client with the same option forwarding, including `getTransactionByHash()` and `getStorageAt()`.

### Signer bridges

Use existing viem or ethers.js wallets as Cosmos signers:

```typescript
import { viemAccountToSigner, keyToViemAccount } from 'initia.js/signer'

// viem private key → Cosmos signer
const signer = viemAccountToSigner('0xprivateKey...')

// RawKey → viem LocalAccount (for EVM dApps)
const account = keyToViemAccount(rawKey)
```

## Architecture

```
Provider  -->  ChainInfo  -->  ChainContext
(registry)     (chain data)    (client + signer + msgs)
```

Domain-specific APIs are available via subpath exports:

| Import path | Description |
|-------------|-------------|
| `initia.js` | Core types, keys, wallet, typed context factories |
| `initia.js/client` | gRPC client, transport, interceptors |
| `initia.js/tx` | Signing, serialization, Amino conversion |
| `initia.js/msgs` | Module-namespaced message builders and decode |
| `initia.js/move` | Move contracts, BCS encoding, ABI |
| `initia.js/evm` | EVM contracts, ABI encoding, JSON-RPC client |
| `initia.js/wasm` | CosmWasm contracts, JSON schema |
| `initia.js/bridge` | OP Bridge, deposit/withdraw/claim, Router API |
| `initia.js/provider` | Registry, custom, and composite providers |
| `initia.js/signer` | Signer interfaces, KeyStore, viem/ethers bridges |
| `initia.js/events` | Event parsing, WebSocket subscriptions |
| `initia.js/util` | Address, hash, denom, formatting utilities |
| `initia.js/usernames` | `.init` domain resolution |
| `initia.js/cosmos` | Cosmos chain-registry integration (Osmosis, Noble, ...) |
| `initia.js/vip` | VIP lock staking, gauge voting, rewards |
| `initia.js/codegen` | ABI codegen for Move, EVM, CosmWasm |

## Examples

See the [examples/](./examples) directory for runnable scripts:

**Getting started**

- [query.ts](./examples/query.ts) -- Read-only gRPC queries
- [send.ts](./examples/send.ts) -- Send tokens with high-level API
- [send-amino.ts](./examples/send-amino.ts) -- Send tokens with Amino signing mode
- [staking.ts](./examples/staking.ts) -- Delegate, redelegate, undelegate, claim rewards
- [get-tx.ts](./examples/get-tx.ts) -- Decode transactions with VM-aware arg enrichment

**Smart contracts**

- [move-contract.ts](./examples/move-contract.ts) -- ABI-driven Move contract interactions
- [move-typed.ts](./examples/move-typed.ts) -- Move contract with full type inference
- [evm-contract.ts](./examples/evm-contract.ts) -- ABI-driven EVM contract interactions
- [evm-typed.ts](./examples/evm-typed.ts) -- EVM contract with full type inference
- [wasm-contract.ts](./examples/wasm-contract.ts) -- CosmWasm contract interactions
- [wasm-typed.ts](./examples/wasm-typed.ts) -- CosmWasm contract with full type inference
- [deploy-cw20.ts](./examples/deploy-cw20.ts) -- Deploy and interact with a CW20 token

**RPC & low-level**

- [rpc.ts](./examples/rpc.ts) -- CometBFT RPC (block results, tx search, consensus)
- [evm-rpc.ts](./examples/evm-rpc.ts) -- EVM JSON-RPC (blocks, logs, receipts)
- [evm-jsonrpc.ts](./examples/evm-jsonrpc.ts) -- EVM JSON-RPC direct calls
- [auth-headers.ts](./examples/auth-headers.ts) -- API key / Bearer auth configuration
- [block-subscription.ts](./examples/block-subscription.ts) -- WebSocket block/event subscriptions
- [raw-send.ts](./examples/raw-send.ts) -- Low-level direct transaction signing
- [raw-send-amino.ts](./examples/raw-send-amino.ts) -- Low-level Amino transaction signing
- [raw-query-historical.ts](./examples/raw-query-historical.ts) -- Query at historical block heights

**Cross-chain**

- [op-bridge.ts](./examples/op-bridge.ts) -- OP Bridge deposit, withdraw, and claim
- [smart-route.ts](./examples/smart-route.ts) -- Router API for cross-chain transfers
- [ibc-transfer.ts](./examples/ibc-transfer.ts) -- IBC transfers between Initia chains
- [noble-ibc-transfer.ts](./examples/noble-ibc-transfer.ts) -- IBC from external Cosmos chains
- [osmosis-custom-provider.ts](./examples/osmosis-custom-provider.ts) -- Custom provider for external Cosmos chains

**Utilities**

- [usernames.ts](./examples/usernames.ts) -- `.init` domain resolution
- [token.ts](./examples/token.ts) -- VM-agnostic token operations
- [vip.ts](./examples/vip.ts) -- VIP lock staking, gauge voting, and reward claims
- [address-utils.ts](./examples/address-utils.ts) -- Address type detection and profile lookup
- [cache-management.ts](./examples/cache-management.ts) -- gRPC response cache control
- [provider-assets.ts](./examples/provider-assets.ts) -- Provider asset and denom lookup
- [keystore.ts](./examples/keystore.ts) -- KeyStore multi-key management

## License

[Apache-2.0](./LICENSE)
