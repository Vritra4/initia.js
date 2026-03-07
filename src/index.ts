/**
 * Initia SDK v2
 *
 * Core entry point — essential types and classes for getting started.
 * Domain-specific APIs are available via subpath exports:
 *
 * - `initia.js/client`    — gRPC client, broadcast, gas, transport
 * - `initia.js/tx`        — signing, serialize/deserialize, amino
 * - `initia.js/msgs`      — message builders (baseMsgs, initiaMsgs, ...)
 * - `initia.js/evm`       — EVM contracts, ABI, RPC, events
 * - `initia.js/move`      — Move contracts, BCS, ABI
 * - `initia.js/wasm`      — CosmWasm contracts, schema
 * - `initia.js/bridge`    — OPInit bridge, deposit/withdraw/claim
 * - `initia.js/provider`  — RegistryProvider, CustomProvider, ...
 * - `initia.js/signer`    — Signer interfaces, KeyStore
 * - `initia.js/events`    — Event parsing, WebSocket subscriptions
 * - `initia.js/util`      — Hash, address, denom, formatting
 * - `initia.js/usernames` — .init domain resolution
 * - `initia.js/cosmos`    — CosmosRegistryProvider
 * - `initia.js/vip`      — VIP lock staking, gauge voting, rewards
 *
 * @packageDocumentation
 */

// =============================================================================
// Core - Fundamental types and utilities
// =============================================================================

export type { Numeric } from './types'
export { Coin, coin, coins, parseCoin, type CoinLike } from './core/coin'
export { getAccount, type AccountInfo, type AuthClient } from './core/account'

// =============================================================================
// Errors
// =============================================================================

export {
  InitiaError,
  AccountNotFoundError,
  AssetNotFoundError,
  AuthenticationError,
  BroadcastError,
  type BroadcastErrorCategory,
  ChainNotFoundError,
  HeaderConflictError,
  isNotFoundError,
  SimulationError,
  TimeoutError,
} from './errors'

// =============================================================================
// Key Management
// =============================================================================

export { Key, DEFAULT_BECH32_PREFIX } from './key'
export { RawKey } from './key'
export {
  MnemonicKey,
  INIT_COIN_TYPE,
  type MnemonicKeyOptions,
  type MnemonicKeyGenerateOptions,
} from './key'
export { HDPath, COIN_TYPE, type CoinType } from './key'

// =============================================================================
// Wallet
// =============================================================================

export {
  Wallet,
  type CreateChainContextFn,
  type CreateTxOptions,
  type WalletSignOptions,
  type SignedTx as WalletSignedTx,
} from './wallet'

export {
  buildChainContextFactory,
  type ChainContext,
  type ChainContextOptions,
  type GetBalanceOptions,
  type GetAccountOptions,
  type GetTokenInfoOptions,
} from './wallet'

export {
  buildTypedFactory,
  L1_CHAIN_IDS,
  type TypedContextOptions,
  type TypedContextFactory,
  type TypedFactoryOptions,
} from './wallet/typed-context'

export { getServicesForChain } from './client/services'

export { buildFromChain, type FromChainOptions, type FromChainResult } from './client/from-chain'

export { WalletBridge } from './wallet'

// =============================================================================
// Message - Core types (also available from initia.js/msgs)
// =============================================================================

export { Message, type MsgInput, type JsonMsg } from './msgs'

// =============================================================================
// Token - VM-agnostic abstraction
// =============================================================================

export {
  resolveTokenContract,
  type TokenContract,
  type EvmEnabled,
  type WasmEnabled,
  type MoveEnabled,
} from './token'

// =============================================================================
// Contracts - VM-agnostic ABI helper
// =============================================================================

export { abi } from './contracts/abi-helpers'
