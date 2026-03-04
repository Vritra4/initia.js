/**
 * Unified Bridge for OPInit L1 ↔ L2 transfers and smart routing.
 *
 * Access via `provider.bridge` — do not instantiate directly.
 */

import type { Numeric } from '../types'
import type { ChainInfo, ChainInfoProvider } from '../provider/types'
import type { Message } from '../msgs/types'
import type {
  DepositOptions,
  WithdrawOptions,
  ClaimOptions,
  WithdrawalInfo,
  RouteOptions,
  Route,
  BuildTransferMsgsOptions,
  TransferTx,
  OpHookOptions,
  OpHookResult,
  SignedOpHook,
  TransferStatus,
  WatchDepositOptions,
  WatchWithdrawalOptions,
  DepositEvent,
  WithdrawalEvent,
  BridgeWatchHandle,
  DepositAndWaitOptions,
  WithdrawAndClaimOptions,
} from './types'
import type { FetchWithdrawalsOptions } from './executor'
import type { Signer } from '../signer/types'
import { OpBridgeInternal } from './op-bridge'
import { RouterClient } from './router-client'
import { watchDeposit, watchWithdrawal, waitForDeposit, waitForClaimable } from './watch'
import { InitiaError } from '../errors'
import { base64 } from '@scure/base'

export class Bridge {
  private opBridge: OpBridgeInternal
  private router?: RouterClient

  constructor(
    private provider: ChainInfoProvider,
    routerUrl?: string
  ) {
    this.opBridge = new OpBridgeInternal(provider)
    if (routerUrl) {
      this.router = new RouterClient(routerUrl)
    }
  }

  // ===========================================================================
  // Direct OP Bridge — OpBridgeInternal에 위임
  // ===========================================================================

  deposit(options: DepositOptions): Message {
    return this.opBridge.deposit(options)
  }

  withdraw(options: WithdrawOptions): Message {
    return this.opBridge.withdraw(options)
  }

  claim(options: ClaimOptions): Message {
    return this.opBridge.claim(options)
  }

  getWithdrawals(
    l2ChainId: string,
    address: string,
    options?: FetchWithdrawalsOptions
  ): Promise<WithdrawalInfo[]> {
    return this.opBridge.getWithdrawals(l2ChainId, address, options)
  }

  getWithdrawalStatus(l2ChainId: string, sequence: Numeric): Promise<WithdrawalInfo> {
    return this.opBridge.getWithdrawalStatus(l2ChainId, sequence)
  }

  listBridgeableChains(): ChainInfo[] {
    return this.opBridge.listBridgeableChains()
  }

  getBridgeId(l2ChainId: string): bigint {
    return this.opBridge.getBridgeId(l2ChainId)
  }

  // ===========================================================================
  // Smart Routing — RouterClient에 위임
  // ===========================================================================

  private requireRouter(): RouterClient {
    if (!this.router) {
      throw new InitiaError('Router API not available for this network')
    }
    return this.router
  }

  route(options: RouteOptions): Promise<Route> {
    return this.requireRouter().route(options)
  }

  buildTransferMsgs(options: BuildTransferMsgsOptions): Promise<TransferTx[]> {
    return this.requireRouter().msgs(options)
  }

  getOpHook(options: OpHookOptions): Promise<OpHookResult> {
    return this.requireRouter().opHook(options)
  }

  async signOpHook(hookResult: OpHookResult, signer: Signer): Promise<SignedOpHook> {
    const hookData = hookResult.hook.join('')
    const hookBytes = new TextEncoder().encode(hookData)
    const signature = await signer.sign(hookBytes)
    const address = await signer.getAddress()
    return {
      hook: base64.encode(signature),
      signer: address,
    }
  }

  trackTransfer(txHash: string, chainId: string): Promise<void> {
    return this.requireRouter().track(txHash, chainId)
  }

  getTransferStatus(txHash: string, chainId: string): Promise<TransferStatus> {
    return this.requireRouter().status(txHash, chainId)
  }

  // ===========================================================================
  // WebSocket Monitoring
  // ===========================================================================

  watchDeposit(
    options: WatchDepositOptions,
    callback: (event: DepositEvent) => void
  ): BridgeWatchHandle {
    return watchDeposit(this.provider, options, callback)
  }

  watchWithdrawal(
    options: WatchWithdrawalOptions,
    callback: (event: WithdrawalEvent) => void
  ): BridgeWatchHandle {
    return watchWithdrawal(this.provider, options, callback)
  }

  waitForDeposit(
    options: WatchDepositOptions & { timeout?: number }
  ): Promise<DepositEvent & { status: 'finalized' }> {
    return waitForDeposit(this.provider, options)
  }

  waitForClaimable(
    options: WatchWithdrawalOptions & { timeout?: number }
  ): Promise<WithdrawalEvent & { status: 'claimable' }> {
    return waitForClaimable(this.provider, options)
  }

  // ===========================================================================
  // High-level helpers — end-to-end bridge operations
  // ===========================================================================

  /**
   * Deposit L1 → L2 and wait for finalization on L2.
   *
   * Combines `deposit()` + `signAndBroadcast()` + `waitForDeposit()` into one call.
   *
   * @example
   * ```typescript
   * const event = await bridge.depositAndWait({
   *   sender: key.address,
   *   toChain: 'rollup-1',
   *   amount: coin('uinit', 1_000_000),
   *   signAndBroadcast: (msgs) => l1.signAndBroadcast(msgs),
   * })
   * console.log(event.status) // 'finalized'
   * ```
   */
  async depositAndWait(
    options: DepositAndWaitOptions
  ): Promise<DepositEvent & { status: 'finalized' }> {
    const msg = this.deposit({
      sender: options.sender,
      to: options.to,
      toChain: options.toChain,
      amount: options.amount,
      data: options.data,
    })
    await options.signAndBroadcast([msg])
    return this.waitForDeposit({
      l2ChainId: options.toChain,
      sender: options.sender,
      recipient: options.to ?? options.sender,
      timeout: options.timeout,
    })
  }

  /**
   * Withdraw L2 → L1, wait for finalization, and auto-claim on L1.
   *
   * Combines `withdraw()` + `signAndBroadcastL2()` + `waitForClaimable()` +
   * `getWithdrawals()` + `claim()` + `signAndBroadcastL1()`.
   *
   * @example
   * ```typescript
   * const withdrawal = await bridge.withdrawAndClaim({
   *   sender: key.address,
   *   amount: coin('uinit', 1_000_000),
   *   l2ChainId: 'rollup-1',
   *   signAndBroadcastL2: (msgs) => l2.signAndBroadcast(msgs),
   *   signAndBroadcastL1: (msgs) => l1.signAndBroadcast(msgs),
   * })
   * ```
   */
  async withdrawAndClaim(options: WithdrawAndClaimOptions): Promise<WithdrawalInfo> {
    // 1. Withdraw on L2
    const withdrawMsg = this.withdraw({
      sender: options.sender,
      to: options.to,
      amount: options.amount,
    })
    await options.signAndBroadcastL2([withdrawMsg])

    // 2. Wait for finalization period
    await this.waitForClaimable({
      l2ChainId: options.l2ChainId,
      sender: options.sender,
      timeout: options.timeout,
    })

    // 3. Fetch withdrawal info with proofs
    const recipient = options.to ?? options.sender
    const withdrawals = await this.getWithdrawals(options.l2ChainId, recipient)
    const claimable = withdrawals.find(w => w.status.status === 'claimable')
    if (!claimable) {
      throw new InitiaError('No claimable withdrawal found after finalization')
    }

    // 4. Claim on L1
    const claimMsg = this.claim({ sender: recipient, withdrawal: claimable })
    await options.signAndBroadcastL1([claimMsg])

    return claimable
  }
}
