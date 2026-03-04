/**
 * OPInit Bridge type definitions.
 *
 * Types for L1 ↔ L2 deposit, withdrawal, and claim operations.
 */

import type { Numeric } from '../types'
import type { Coin } from '../core/coin'
import type { Message } from '../msgs/types'

/**
 * Deposit options for L1 → L2 token transfer.
 *
 * Use `toChain` for automatic bridgeId resolution from provider,
 * or `bridgeId` for direct specification.
 */
export type DepositOptions = {
  sender: string
  /** L2 recipient address. Defaults to sender if omitted. */
  to?: string
  /** Amount to deposit. String format parsed via parseCoin (e.g., '1000000uinit'). */
  amount: Coin | string
  /** Hook data for L2 execution. Defaults to empty bytes. */
  data?: Uint8Array
} & ({ toChain: string; bridgeId?: never } | { toChain?: never; bridgeId: Numeric })

/**
 * Withdrawal options for L2 → L1 token transfer.
 */
export interface WithdrawOptions {
  sender: string
  /** L1 recipient address. Defaults to sender if omitted. */
  to?: string
  /** Amount to withdraw. String format parsed via parseCoin. */
  amount: Coin | string
}

/**
 * Claim options for finalizing a withdrawal on L1.
 */
export interface ClaimOptions {
  /** Claim executor address (usually the withdrawal recipient). */
  sender: string
  /** Withdrawal data obtained from getWithdrawals(). Must have status 'claimable'. */
  withdrawal: WithdrawalInfo
}

/**
 * Withdrawal information including Executor-provided proof data.
 *
 * Populated by Executor API (basic fields + proof data) and
 * L1 ophost queries (status determination).
 */
export interface WithdrawalInfo {
  sequence: bigint
  /** L2 sender address. */
  from: string
  /** L1 recipient address. */
  to: string
  amount: Coin
  outputIndex: bigint
  bridgeId: bigint
  txHash: string
  /** Withdrawal lifecycle status, determined by L1 queries. */
  status: WithdrawalStatus

  /** Merkle proofs from Executor (hex-encoded). */
  withdrawalProofs: string[]
  /** Output version from Executor (hex-encoded). */
  version: string
  /** Storage root from Executor (hex-encoded). */
  storageRoot: string
  /** Last block hash from Executor (hex-encoded). */
  lastBlockHash: string
}

/**
 * Withdrawal lifecycle status.
 *
 * - pending: Not yet included in any proposed output.
 * - waiting: Included in output, awaiting finalization period.
 * - claimable: Finalization period passed, ready to claim on L1.
 * - claimed: Already finalized on L1.
 */
export type WithdrawalStatus =
  | { status: 'pending' }
  | { status: 'waiting'; claimableAt: Date }
  | { status: 'claimable' }
  | { status: 'claimed' }

// =============================================================================
// Router types — Smart routing via Router API
// =============================================================================

/**
 * Options for finding a transfer route.
 */
export interface RouteOptions {
  /** Transfer amount in minimal denomination (e.g., '1000000'). */
  amount: string
  /** Source chain and asset. */
  source: { chainId: string; denom: string }
  /** Destination chain and asset. */
  dest: { chainId: string; denom: string }
  /** Allow routes that may involve risk (default: true). */
  allowUnsafe?: boolean
  /** Prefer faster routes (default: false). */
  goFast?: boolean
}

/**
 * A resolved transfer route from the Router API.
 *
 * Contains amounts, operations, and the raw server response needed
 * for buildTransferMsgs().
 */
export interface Route {
  amountIn: string
  amountOut: string
  source: { chainId: string; denom: string; symbol?: string }
  dest: { chainId: string; denom: string; symbol?: string }
  /** Normalized operations (for display purposes). */
  operations: RouteOperation[]
  estimatedDurationSeconds?: number
  usdAmountIn?: string
  usdAmountOut?: string
  warnings?: string[]
  /** True if getOpHook() + signOpHook() must be called before buildTransferMsgs(). */
  requiresOpHook?: boolean
  /** @internal Server's original response. Used by buildTransferMsgs(); not intended for user access. */
  _raw: unknown
}

/**
 * A single operation within a route.
 */
export type RouteOperation =
  | { type: 'transfer'; chainId: string; channel: string; denomIn: string; denomOut: string }
  | { type: 'swap'; poolId: string; denomIn: string; denomOut: string }
  | { type: 'op_init_transfer'; denomIn: string; denomOut: string }
  | { type: 'axelar_transfer'; denomIn: string; denomOut: string }
  | { type: 'cctp_transfer'; denomIn: string; denomOut: string }
  | { type: 'layer_zero_transfer'; denomIn: string; denomOut: string }

/**
 * Options for building transfer messages from a route.
 */
export interface BuildTransferMsgsOptions {
  route: Route
  /** Addresses for each chain in the path: [source, ...hops, dest]. */
  addresses: string[]
  /** Slippage tolerance as percentage string (default: '1' = 1%). */
  slippageTolerance?: string
  /** Signed OP Hook data. Required when route.requiresOpHook is true. */
  signedOpHook?: SignedOpHook
}

/**
 * A transaction to execute as part of a multi-hop transfer.
 */
export interface TransferTx {
  /** Chain where this transaction should be signed and broadcast. */
  chainId: string
  /** Cosmos messages for signAndBroadcast. */
  cosmosMsgs?: Message[]
  /** EVM transaction data (for native EVM chains). */
  evmTx?: { to: string; data: string; value?: string }
  /** Address that must sign this transaction. */
  signerAddress: string
}

/**
 * Options for requesting OP Hook data.
 */
export interface OpHookOptions {
  sourceAddress: string
  sourceChainId: string
  sourceDenom: string
  destAddress: string
  destChainId: string
  destDenom: string
}

/**
 * OP Hook data returned by the Router API.
 */
export interface OpHookResult {
  chainId: string
  hook: string[]
}

/**
 * Signed OP Hook data to pass to buildTransferMsgs().
 */
export interface SignedOpHook {
  hook: string
  signer: string
}

/**
 * Transfer tracking status from the Router API.
 */
export interface TransferStatus {
  status: 'pending' | 'complete' | 'failed'
  txHash: string
}

// =============================================================================
// High-level helpers
// =============================================================================

/**
 * Options for depositAndWait — deposit L1 → L2 and wait for finalization.
 */
export interface DepositAndWaitOptions {
  sender: string
  /** L2 recipient address. Defaults to sender. */
  to?: string
  /** Target L2 chain (required for watching finalization). */
  toChain: string
  /** Amount to deposit. */
  amount: Coin | string
  /** Hook data for L2 execution. */
  data?: Uint8Array
  /** Sign and broadcast on L1. */
  signAndBroadcast: (msgs: Message[]) => Promise<unknown>
  /** Timeout in milliseconds (default: 5 minutes). */
  timeout?: number
}

/**
 * Options for withdrawAndClaim — withdraw L2 → L1, wait for finalization, and auto-claim.
 */
export interface WithdrawAndClaimOptions {
  sender: string
  /** L1 recipient address. Defaults to sender. */
  to?: string
  /** Amount to withdraw. */
  amount: Coin | string
  /** L2 chain ID. */
  l2ChainId: string
  /** Sign and broadcast withdrawal on L2. */
  signAndBroadcastL2: (msgs: Message[]) => Promise<unknown>
  /** Sign and broadcast claim on L1. */
  signAndBroadcastL1: (msgs: Message[]) => Promise<unknown>
  /** Timeout in milliseconds (default: 2 hours). */
  timeout?: number
}

// =============================================================================
// Bridge Watch types — WebSocket-based real-time monitoring
// =============================================================================

export type DepositEvent =
  | {
      status: 'initiated'
      l1Sequence: bigint
      from: string
      to: string
      amount: string
      bridgeId: bigint
    }
  | {
      status: 'finalized'
      l1Sequence: bigint
      recipient: string
      amount: string
      success: boolean
      reason?: string
    }

export type WithdrawalEvent =
  | { status: 'initiated'; l2Sequence: bigint; from: string; to: string; amount: string }
  | { status: 'proposed'; outputIndex: bigint; l2BlockNumber: bigint }
  | { status: 'waiting'; claimableAt: Date }
  | { status: 'claimable' }
  | { status: 'claimed'; l2Sequence: bigint; from: string; to: string; amount: string }

export interface WatchDepositOptions {
  l2ChainId: string
  l1Sequence?: Numeric
  sender?: string
  recipient?: string
}

export interface WatchWithdrawalOptions {
  l2ChainId: string
  l2Sequence?: Numeric
  sender?: string
  timeout?: number
}

export interface BridgeWatchHandle {
  unsubscribe(): void
}
