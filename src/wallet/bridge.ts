/**
 * WalletBridge - Convenience wrapper for bridge operations via Wallet.
 *
 * Combines Bridge message generation with ChainContext signing/broadcasting.
 * Automatically derives sender addresses from the wallet key.
 */

import type { Numeric } from '../types'
import { Bridge } from '../bridge/bridge'
import type { ChainInfoProvider } from '../provider/types'
import type { WithdrawalInfo } from '../bridge/types'
import type { FetchWithdrawalsOptions } from '../bridge/executor'
import type { Coin } from '../core/coin'
import type { ChainContext, BroadcastResultWithWait } from './chain-context'

/**
 * Bridge accessor for Wallet — provides one-call deposit/withdraw/claim
 * with automatic sender derivation and signing.
 *
 * @example
 * ```typescript
 * const wallet = new Wallet({ key, provider })
 *
 * // L1 → L2 deposit
 * const result = await wallet.bridge.deposit('minimove-1', '1000000uinit')
 * await result.waitForConfirmation()
 *
 * // L2 → L1 withdraw
 * await wallet.bridge.withdraw('minimove-1', '1000000umin')
 *
 * // Check withdrawal status
 * const withdrawals = await wallet.bridge.getWithdrawals('minimove-1')
 *
 * // Claim a claimable withdrawal on L1
 * const claimable = withdrawals.find(w => w.status.status === 'claimable')
 * if (claimable) await wallet.bridge.claim(claimable)
 * ```
 */
export class WalletBridge {
  /** Underlying Bridge instance for advanced/direct usage. */
  readonly op: Bridge
  private readonly provider: ChainInfoProvider
  private readonly contextCache = new Map<string, ChainContext>()

  constructor(
    private readonly getChainContext: (chainId: string) => ChainContext,
    private readonly getAddress: (chainId: string) => string,
    provider: ChainInfoProvider
  ) {
    this.provider = provider
    if (!provider.createTransport) {
      throw new Error('createTransport not set on provider — use createWallet() or a typed context factory')
    }
    this.op = new Bridge(provider, provider.createTransport)
  }

  /**
   * Get or create a ChainContext for a chain, reusing cached instances.
   * This preserves _nextSequence across consecutive bridge operations.
   */
  private getCachedContext(chainId: string): ChainContext {
    let ctx = this.contextCache.get(chainId)
    if (!ctx) {
      ctx = this.getChainContext(chainId)
      this.contextCache.set(chainId, ctx)
    }
    return ctx
  }

  /**
   * Find the L1 chain ID from provider.
   */
  private findL1ChainId(): string {
    const l1 = this.provider.listChains().find(c => c.chainType === 'initia')
    if (!l1) {
      throw new Error('L1 (initia) chain not found in provider')
    }
    return l1.chainId
  }

  /**
   * Deposit tokens from L1 → L2.
   *
   * Signs and broadcasts on L1 chain. Sender is auto-derived from wallet key.
   *
   * @param l2ChainId - Target L2 chain ID (e.g., 'minimove-1')
   * @param amount - Amount to deposit (e.g., '1000000uinit' or Coin)
   * @param options - Optional recipient and bridgeId override
   * @returns Broadcast result with waitForConfirmation()
   */
  async deposit(
    l2ChainId: string,
    amount: string | Coin,
    options?: { to?: string; bridgeId?: Numeric }
  ): Promise<BroadcastResultWithWait> {
    const l1ChainId = this.findL1ChainId()
    const sender = this.getAddress(l1ChainId)

    const depositOptions =
      options?.bridgeId != null
        ? { sender, bridgeId: options.bridgeId, amount, to: options?.to }
        : { sender, toChain: l2ChainId, amount, to: options?.to }

    const msg = this.op.deposit(depositOptions)
    const ctx = this.getCachedContext(l1ChainId)
    return ctx.signAndBroadcast([msg])
  }

  /**
   * Initiate withdrawal from L2 → L1.
   *
   * Signs and broadcasts on L2 chain. Sender is auto-derived from wallet key.
   *
   * @param l2ChainId - Source L2 chain ID (e.g., 'minimove-1')
   * @param amount - Amount to withdraw (e.g., '1000000umin' or Coin)
   * @param options - Optional recipient on L1
   * @returns Broadcast result with waitForConfirmation()
   */
  async withdraw(
    l2ChainId: string,
    amount: string | Coin,
    options?: { to?: string }
  ): Promise<BroadcastResultWithWait> {
    const sender = this.getAddress(l2ChainId)

    const msg = this.op.withdraw({
      sender,
      amount,
      to: options?.to,
    })
    const ctx = this.getCachedContext(l2ChainId)
    return ctx.signAndBroadcast([msg])
  }

  /**
   * Claim a completed withdrawal on L1.
   *
   * Signs and broadcasts on L1 chain. Sender is auto-derived from wallet key.
   *
   * @param withdrawal - Withdrawal info (must have status 'claimable')
   * @returns Broadcast result with waitForConfirmation()
   * @throws Error if withdrawal is not claimable
   */
  async claim(withdrawal: WithdrawalInfo): Promise<BroadcastResultWithWait> {
    const l1ChainId = this.findL1ChainId()
    const sender = this.getAddress(l1ChainId)

    const msg = this.op.claim({ sender, withdrawal })
    const ctx = this.getCachedContext(l1ChainId)
    return ctx.signAndBroadcast([msg])
  }

  /**
   * Get withdrawals with status for an L2 chain.
   *
   * Address is auto-derived from wallet key for the L2 chain.
   *
   * @param l2ChainId - L2 chain ID
   * @param options - Pagination options
   */
  async getWithdrawals(
    l2ChainId: string,
    options?: FetchWithdrawalsOptions
  ): Promise<WithdrawalInfo[]> {
    const address = this.getAddress(l2ChainId)
    return this.op.getWithdrawals(l2ChainId, address, options)
  }

  /**
   * Get status of a single withdrawal.
   *
   * @param l2ChainId - L2 chain ID
   * @param sequence - Withdrawal sequence number
   */
  async getWithdrawalStatus(l2ChainId: string, sequence: Numeric): Promise<WithdrawalInfo> {
    return this.op.getWithdrawalStatus(l2ChainId, sequence)
  }

  /**
   * Get the bridge ID for an L2 chain.
   */
  getBridgeId(l2ChainId: string): bigint {
    return this.op.getBridgeId(l2ChainId)
  }

  /**
   * List all chains that support OPInit bridging.
   */
  listBridgeableChains() {
    return this.op.listBridgeableChains()
  }
}
