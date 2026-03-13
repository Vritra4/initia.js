/**
 * Client type definitions for Initia SDK.
 */

import type { QueryClient } from './grpc-client'
import type { Numeric } from '../types'
import type { Message } from '../msgs/types'

// Service imports for typing
import type { Query as AuthQuery } from '@initia/initia-proto/cosmos/auth/v1beta1/query_pb'
import type { Query as BankQuery } from '@initia/initia-proto/cosmos/bank/v1beta1/query_pb'
import type { Service as TxService } from '@initia/initia-proto/cosmos/tx/v1beta1/service_pb'
import type { Service as TendermintService } from '@initia/initia-proto/cosmos/base/tendermint/v1beta1/query_pb'
import type { Query as GovQuery } from '@initia/initia-proto/cosmos/gov/v1/query_pb'
import type { Query as MstakingQuery } from '@initia/initia-proto/initia/mstaking/v1/query_pb'
import type { Query as MoveQuery } from '@initia/initia-proto/initia/move/v1/query_pb'
import type { Query as InitiaDistributionQuery } from '@initia/initia-proto/initia/distribution/v1/query_pb'
import type { Query as OphostQuery } from '@initia/opinit-proto/opinit/ophost/v1/query_pb'
import type { Query as OpchildQuery } from '@initia/opinit-proto/opinit/opchild/v1/query_pb'
import type { Query as EvmQuery } from '@initia/minievm-proto/minievm/evm/v1/query_pb'
import type { Query as WasmQuery } from '@initia/miniwasm-proto/cosmwasm/wasm/v1/query_pb'

/**
 * Supported chain types.
 * - initia: Initia L1
 * - minievm: EVM-based rollup
 * - miniwasm: CosmWasm-based rollup
 * - minimove: Move-based rollup
 * - other: Other Cosmos SDK chains (Celestia, Osmosis, etc.)
 */
export type ChainType = 'initia' | 'minievm' | 'miniwasm' | 'minimove' | 'other'

/**
 * Network type with common presets.
 * Accepts any string for custom networks.
 */
export type NetworkType = 'mainnet' | 'testnet' | 'local' | (string & {})

/**
 * Base client with services common to all Cosmos SDK chains.
 */
export interface BaseClient {
  auth: QueryClient<typeof AuthQuery>
  bank: QueryClient<typeof BankQuery>
  tx: QueryClient<typeof TxService>
  tendermint: QueryClient<typeof TendermintService>
}

/**
 * Initia L1 client.
 */
export interface InitiaClient extends BaseClient {
  mstaking: QueryClient<typeof MstakingQuery>
  move: QueryClient<typeof MoveQuery>
  distribution: QueryClient<typeof InitiaDistributionQuery>
  ophost: QueryClient<typeof OphostQuery>
  gov: QueryClient<typeof GovQuery>
}

/**
 * Minievm rollup client.
 */
export interface MinievmClient extends BaseClient {
  evm: QueryClient<typeof EvmQuery>
  opchild: QueryClient<typeof OpchildQuery>
}

/**
 * Miniwasm rollup client.
 */
export interface MiniwasmClient extends BaseClient {
  wasm: QueryClient<typeof WasmQuery>
  opchild: QueryClient<typeof OpchildQuery>
}

/**
 * Minimove rollup client.
 */
export interface MinimoveClient extends BaseClient {
  move: QueryClient<typeof MoveQuery>
  opchild: QueryClient<typeof OpchildQuery>
}

/**
 * Union of all chain-specific clients.
 * Can be aliased on import: `import { Client as MyClient } from 'initia.js'`
 */
export type Client = InitiaClient | MinievmClient | MiniwasmClient | MinimoveClient | BaseClient

/**
 * Map chain type to its specific client interface.
 */
interface ClientMap {
  initia: InitiaClient
  minievm: MinievmClient
  miniwasm: MiniwasmClient
  minimove: MinimoveClient
  other: BaseClient
}

/**
 * Narrowed client type for a specific chain type.
 *
 * When T is a specific chain type, resolves to the corresponding client:
 * - `ClientFor<'minievm'>` → `MinievmClient` (has `.evm` in autocomplete)
 * - `ClientFor<'initia'>` → `InitiaClient` (has `.move`, `.ophost`, etc.)
 *
 * When T is the union `ChainType`, resolves to the union of all clients (same as `Client`).
 */
export type ClientFor<T extends ChainType> = ClientMap[T]

/**
 * Minimal interface for any object that provides client access.
 * Used as a dependency constraint in functions that need a client
 * but don't require a specific client type.
 */
export interface HasClient {
  readonly client: unknown
}

// =============================================================================
// Service-Specific Context Types
// =============================================================================

/**
 * Context with EVM service access.
 * Required for EVM contract operations (createEvmContract, etc.)
 */
export interface HasEvmService {
  readonly client: { evm: QueryClient<typeof EvmQuery> }
}

/**
 * Context with Wasm service access.
 * Required for CosmWasm contract operations (createWasmContract, etc.)
 */
export interface HasWasmService {
  readonly client: { wasm: QueryClient<typeof WasmQuery> }
}

/**
 * Context with Move service access.
 * Required for Move contract operations (createMoveContract, etc.)
 */
export interface HasMoveService {
  readonly client: { move: QueryClient<typeof MoveQuery> }
}

// =============================================================================
// Auth & Query Types
// =============================================================================

/**
 * Authentication configuration for RPC providers.
 *
 * For non-standard auth schemes, use `headers` option directly instead.
 */
export type AuthConfig =
  | { type: 'bearer'; token: string }
  | { type: 'api-key'; key: string; header?: string }
  | { type: 'basic'; username: string; password: string }

/**
 * Factory helpers for creating AuthConfig.
 *
 * @example
 * ```typescript
 * auth.apiKey('sk-12345')
 * auth.apiKey('key', 'x-alchemy-token')
 * auth.bearer('eyJhbGciOiJIUzI1NiIs...')
 * auth.basic('username', 'password')
 * ```
 */
export const auth = {
  bearer: (token: string): AuthConfig => ({ type: 'bearer', token }),
  apiKey: (key: string, header?: string): AuthConfig => ({ type: 'api-key', key, header }),
  basic: (username: string, password: string): AuthConfig => ({
    type: 'basic',
    username,
    password,
  }),
} as const

/**
 * Shared per-request options for all fetch-based clients (gRPC, EVM JSON-RPC, etc.).
 */
export interface HttpRequestOptions {
  /** Request timeout in milliseconds */
  timeoutMs?: number

  /** Abort signal for request cancellation */
  signal?: AbortSignal

  /**
   * Override auth for this request only.
   * Completely replaces context-level auth (not merged).
   */
  auth?: AuthConfig

  /** Additional headers for this request */
  headers?: Record<string, string>
}

/**
 * Per-request options for gRPC unary queries.
 * Extends HttpRequestOptions with gRPC-specific fields.
 *
 * Passed as the second argument to client service methods:
 * ```typescript
 * await client.bank.balance(request, queryOptions)
 * ```
 */
export interface QueryOptions extends HttpRequestOptions {
  /** Query at a specific block height */
  height?: Numeric

  /** Bypass cache for this request */
  skipCache?: boolean

  /**
   * Callback for response headers.
   * Called once when unary response headers are received.
   */
  onHeaders?: (headers: Headers) => void

  /**
   * Callback for response trailers.
   * Called when gRPC trailers (status, error info, etc.) are received.
   */
  onTrailer?: (trailers: Headers) => void
}

// =============================================================================
// Transaction Types
// =============================================================================

/**
 * Signing mode for transactions.
 * - 'direct': Protobuf binary signing (default, most efficient)
 * - 'amino': Legacy JSON signing (required by some wallets like Keplr)
 * - 'eip191': EIP-191 signing for EVM-compatible chains
 */
export type SignModeType = 'direct' | 'amino' | 'eip191'

/**
 * Options for creating a transaction.
 */
export interface TxOptions {
  /** Fee to pay for the transaction */
  fee?: { denom: string; amount: string }[]
  /** Gas limit for the transaction */
  gasLimit?: Numeric
  /** Optional memo to include */
  memo?: string
  /** Signing mode (default: 'direct') */
  signMode?: SignModeType
}

/**
 * Unsigned transaction ready for signing.
 *
 * Contains all structured data needed to produce a signed transaction.
 * Encoding (bodyBytes, authInfoBytes) is deferred to sign() based on signMode.
 */
export interface UnsignedTx {
  /** Messages to include in the transaction */
  msgs: Message[]
  /** Signing mode determined for this transaction */
  signMode: SignModeType
  /** Chain ID for signing */
  chainId: string
  /** Account number for signing */
  accountNumber: bigint
  /** Account sequence number */
  sequence: bigint
  /** Fee for the transaction */
  fee: { denom: string; amount: string }[]
  /** Gas limit */
  gasLimit: bigint
  /** Memo */
  memo: string
}

/**
 * Signed transaction ready for broadcast.
 */
export interface SignedTx {
  /** Encoded signed transaction */
  txBytes: Uint8Array
}

// =============================================================================
// Usernames Conditional Types
// =============================================================================

/**
 * Networks that support the username service.
 */
export type UsernamesSupportedNetwork = 'mainnet' | 'testnet'

/**
 * Whether usernames should be available for the given chain/network combination.
 * True only when ChainType is 'initia' AND NetworkType is 'mainnet' | 'testnet'.
 *
 * Defined here (not in usernames/types.ts) to avoid circular references
 * with ChainType and NetworkType.
 */
export type HasUsernames<C extends ChainType, N extends NetworkType> = C extends 'initia'
  ? N extends UsernamesSupportedNetwork
    ? true
    : false
  : false
