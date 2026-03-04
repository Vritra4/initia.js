/**
 * Bridge WebSocket monitor — real-time deposit/withdrawal tracking.
 */

import type { ChainInfoProvider } from '../provider/types'
import type { Subscription, WsTxResult } from '../client/websocket'
import { createSession, type WebSocketSession } from '../client/websocket/session'
import type { InitiaClient } from '../client/types'
import { fromChain } from '../client/from-chain-standalone'
import { WebSocketNotAvailableError } from '../errors'
import { durationToMs } from './utils'
import type {
  DepositEvent,
  WithdrawalEvent,
  WatchDepositOptions,
  WatchWithdrawalOptions,
  BridgeWatchHandle,
} from './types'

// =============================================================================
// Helpers
// =============================================================================

/**
 * Extract events of a specific type from a WebSocket TxResult.
 * Returns an array of attribute maps for each matching event.
 */
export function parseTxEvents(tx: WsTxResult, eventType: string): Record<string, string>[] {
  const results: Record<string, string>[] = []
  const events = tx.result?.events ?? []

  for (const event of events) {
    if (event.type !== eventType) continue

    const attrs: Record<string, string> = {}
    for (const attr of event.attributes ?? []) {
      if (attr.key && attr.value !== undefined) {
        attrs[attr.key] = attr.value
      }
    }
    results.push(attrs)
  }

  return results
}

function buildDepositFilter(
  eventType: string,
  opts: WatchDepositOptions,
  bridgeId?: bigint
): string | undefined {
  const conditions: string[] = []

  if (eventType === 'initiate_token_deposit') {
    if (bridgeId !== undefined) conditions.push(`initiate_token_deposit.bridge_id='${bridgeId}'`)
    if (opts.l1Sequence !== undefined)
      conditions.push(`initiate_token_deposit.l1_sequence='${opts.l1Sequence}'`)
    if (opts.sender) conditions.push(`initiate_token_deposit.from='${opts.sender}'`)
    if (opts.recipient) conditions.push(`initiate_token_deposit.to='${opts.recipient}'`)
  } else if (eventType === 'finalize_token_deposit') {
    if (opts.l1Sequence !== undefined)
      conditions.push(`finalize_token_deposit.l1_sequence='${opts.l1Sequence}'`)
    if (opts.sender) conditions.push(`finalize_token_deposit.sender='${opts.sender}'`)
    if (opts.recipient) conditions.push(`finalize_token_deposit.recipient='${opts.recipient}'`)
  }

  return conditions.length > 0 ? conditions.join(' AND ') : undefined
}

function buildWithdrawalFilter(
  eventType: string,
  opts: WatchWithdrawalOptions,
  bridgeId?: bigint
): string | undefined {
  const conditions: string[] = []

  if (eventType === 'initiate_token_withdrawal') {
    if (opts.l2Sequence !== undefined)
      conditions.push(`initiate_token_withdrawal.l2_sequence='${opts.l2Sequence}'`)
    if (opts.sender) conditions.push(`initiate_token_withdrawal.from='${opts.sender}'`)
  } else if (eventType === 'propose_output') {
    if (bridgeId !== undefined) conditions.push(`propose_output.bridge_id='${bridgeId}'`)
  } else if (eventType === 'finalize_token_withdrawal') {
    if (bridgeId !== undefined) conditions.push(`finalize_token_withdrawal.bridge_id='${bridgeId}'`)
    if (opts.l2Sequence !== undefined)
      conditions.push(`finalize_token_withdrawal.l2_sequence='${opts.l2Sequence}'`)
  }

  return conditions.length > 0 ? conditions.join(' AND ') : undefined
}

// =============================================================================
// watchDeposit
// =============================================================================

/**
 * Watch deposit events in real-time via WebSocket.
 *
 * Subscribes to L1 initiate_token_deposit and L2 finalize_token_deposit events.
 * Call `handle.unsubscribe()` to stop watching and close connections.
 */
export function watchDeposit(
  provider: ChainInfoProvider,
  options: WatchDepositOptions,
  callback: (event: DepositEvent) => void
): BridgeWatchHandle {
  const l2Info = provider.getChainInfo(options.l2ChainId)
  if (!l2Info) throw new Error(`Chain not found: ${options.l2ChainId}`)

  const l1Info = provider.listChains().find(c => c.chainType === 'initia')
  if (!l1Info) throw new Error('L1 (initia) chain not found in provider')

  if (!l1Info.wss) throw new WebSocketNotAvailableError(l1Info.chainId)
  if (!l2Info.wss) throw new WebSocketNotAvailableError(l2Info.chainId)

  const bridgeId = l2Info.opBridgeId
  const sessions: WebSocketSession[] = []
  const subs: Subscription[] = []

  const cleanup = () => {
    for (const sub of subs) sub.unsubscribe()
    for (const session of sessions) session.close()
    subs.length = 0
    sessions.length = 0
  }

  // L1: initiate_token_deposit
  const l1Session = createSession(l1Info)
  sessions.push(l1Session)
  const l1Filter = buildDepositFilter('initiate_token_deposit', options, bridgeId)

  void l1Session
    .subscribe({ event: 'tx', filter: l1Filter }, rawTx => {
      const tx = rawTx
      const events = parseTxEvents(tx, 'initiate_token_deposit')
      for (const attrs of events) {
        if (options.l1Sequence !== undefined && attrs.l1_sequence !== String(options.l1Sequence))
          continue
        callback({
          status: 'initiated',
          l1Sequence: BigInt(attrs.l1_sequence ?? '0'),
          from: attrs.from ?? '',
          to: attrs.to ?? '',
          amount: attrs.amount ?? '0',
          bridgeId: BigInt(attrs.bridge_id ?? '0'),
        })
      }
    })
    .then(sub => subs.push(sub))
    .catch(() => {})

  // L2: finalize_token_deposit
  const l2Session = createSession(l2Info)
  sessions.push(l2Session)
  const l2Filter = buildDepositFilter('finalize_token_deposit', options)

  void l2Session
    .subscribe({ event: 'tx', filter: l2Filter }, rawTx => {
      const tx = rawTx
      const events = parseTxEvents(tx, 'finalize_token_deposit')
      for (const attrs of events) {
        if (options.l1Sequence !== undefined && attrs.l1_sequence !== String(options.l1Sequence))
          continue
        callback({
          status: 'finalized',
          l1Sequence: BigInt(attrs.l1_sequence ?? '0'),
          recipient: attrs.recipient ?? '',
          amount: attrs.amount ?? '0',
          success: attrs.success === 'true',
          reason: attrs.reason || undefined,
        })
      }
    })
    .then(sub => subs.push(sub))
    .catch(() => {})

  return { unsubscribe: cleanup }
}

// =============================================================================
// watchWithdrawal
// =============================================================================

/**
 * Watch withdrawal events in real-time via WebSocket.
 *
 * Subscribes to L2 initiate_token_withdrawal, L1 propose_output, and
 * L1 finalize_token_withdrawal events. Emits 'waiting' and 'claimable'
 * events based on the finalization period.
 *
 * Call `handle.unsubscribe()` to stop watching and close connections.
 */
export function watchWithdrawal(
  provider: ChainInfoProvider,
  options: WatchWithdrawalOptions,
  callback: (event: WithdrawalEvent) => void
): BridgeWatchHandle {
  const l2Info = provider.getChainInfo(options.l2ChainId)
  if (!l2Info) throw new Error(`Chain not found: ${options.l2ChainId}`)
  if (l2Info.opBridgeId == null) throw new Error(`Chain ${options.l2ChainId} has no opBridgeId`)

  const l1Info = provider.listChains().find(c => c.chainType === 'initia')
  if (!l1Info) throw new Error('L1 (initia) chain not found in provider')

  if (!l1Info.wss) throw new WebSocketNotAvailableError(l1Info.chainId)
  if (!l2Info.wss) throw new WebSocketNotAvailableError(l2Info.chainId)

  const bridgeId = l2Info.opBridgeId
  const sessions: WebSocketSession[] = []
  const subs: Subscription[] = []
  const timers: ReturnType<typeof setTimeout>[] = []
  let timeoutTimer: ReturnType<typeof setTimeout> | null = null

  const cleanup = () => {
    for (const sub of subs) sub.unsubscribe()
    for (const session of sessions) session.close()
    for (const timer of timers) clearTimeout(timer)
    if (timeoutTimer) clearTimeout(timeoutTimer)
    subs.length = 0
    sessions.length = 0
    timers.length = 0
  }

  if (options.timeout) {
    timeoutTimer = setTimeout(cleanup, options.timeout)
  }

  // Fetch finalization period once (async, best-effort)
  let finalizationMs: number | undefined
  void (async () => {
    try {
      const { client } = fromChain(l1Info.chainId, { provider })
      const ophost = (client as InitiaClient).ophost
      const resp = await ophost.bridge({ bridgeId })
      const fp = resp.bridgeConfig?.finalizationPeriod
      if (fp) finalizationMs = durationToMs(fp)
    } catch {
      // If we can't get finalization period, skip waiting -> claimable
    }
  })()

  // L2: initiate_token_withdrawal
  const l2Session = createSession(l2Info)
  sessions.push(l2Session)
  const l2Filter = buildWithdrawalFilter('initiate_token_withdrawal', options)

  void l2Session
    .subscribe({ event: 'tx', filter: l2Filter }, rawTx => {
      const tx = rawTx
      const events = parseTxEvents(tx, 'initiate_token_withdrawal')
      for (const attrs of events) {
        if (options.l2Sequence !== undefined && attrs.l2_sequence !== String(options.l2Sequence))
          continue
        callback({
          status: 'initiated',
          l2Sequence: BigInt(attrs.l2_sequence ?? '0'),
          from: attrs.from ?? '',
          to: attrs.to ?? '',
          amount: attrs.amount ?? '0',
        })
      }
    })
    .then(sub => subs.push(sub))
    .catch(() => {})

  // L1: propose_output + finalize_token_withdrawal
  const l1Session = createSession(l1Info)
  sessions.push(l1Session)

  const proposeFilter = buildWithdrawalFilter('propose_output', options, bridgeId)
  void l1Session
    .subscribe({ event: 'tx', filter: proposeFilter }, rawTx => {
      const tx = rawTx
      const events = parseTxEvents(tx, 'propose_output')
      for (const attrs of events) {
        if (attrs.bridge_id !== String(bridgeId)) continue

        const outputIndex = BigInt(attrs.output_index ?? '0')
        const l2BlockNumber = BigInt(attrs.l2_block_number ?? '0')

        callback({ status: 'proposed', outputIndex, l2BlockNumber })

        if (finalizationMs !== undefined) {
          const claimableAt = new Date(Date.now() + finalizationMs)
          callback({ status: 'waiting', claimableAt })

          const timer = setTimeout(() => {
            callback({ status: 'claimable' })
          }, finalizationMs)
          timers.push(timer)
        }
      }
    })
    .then(sub => subs.push(sub))
    .catch(() => {})

  const claimFilter = buildWithdrawalFilter('finalize_token_withdrawal', options, bridgeId)
  void l1Session
    .subscribe({ event: 'tx', filter: claimFilter }, rawTx => {
      const tx = rawTx
      const events = parseTxEvents(tx, 'finalize_token_withdrawal')
      for (const attrs of events) {
        if (options.l2Sequence !== undefined && attrs.l2_sequence !== String(options.l2Sequence))
          continue
        callback({
          status: 'claimed',
          l2Sequence: BigInt(attrs.l2_sequence ?? '0'),
          from: attrs.from ?? '',
          to: attrs.to ?? '',
          amount: attrs.amount ?? '0',
        })
      }
    })
    .then(sub => subs.push(sub))
    .catch(() => {})

  return { unsubscribe: cleanup }
}

// =============================================================================
// Promise wrappers
// =============================================================================

/**
 * Wait for a deposit to be finalized on L2.
 *
 * Returns a Promise that resolves when the finalize_token_deposit event
 * is observed on L2. Rejects on timeout (default: 5 minutes).
 */
export function waitForDeposit(
  provider: ChainInfoProvider,
  options: WatchDepositOptions & { timeout?: number }
): Promise<DepositEvent & { status: 'finalized' }> {
  return new Promise((resolve, reject) => {
    const timeout = options.timeout ?? 300_000

    const handle = watchDeposit(provider, options, event => {
      if (event.status === 'finalized') {
        handle.unsubscribe()
        if (timer) clearTimeout(timer)
        resolve(event)
      }
    })

    const timer = setTimeout(() => {
      handle.unsubscribe()
      reject(new Error(`waitForDeposit timed out after ${timeout}ms`))
    }, timeout)
  })
}

/**
 * Wait for a withdrawal to become claimable on L1.
 *
 * Returns a Promise that resolves when the finalization period passes
 * after an output proposal. Rejects on timeout (default: 2 hours).
 */
export function waitForClaimable(
  provider: ChainInfoProvider,
  options: WatchWithdrawalOptions & { timeout?: number }
): Promise<WithdrawalEvent & { status: 'claimable' }> {
  return new Promise((resolve, reject) => {
    const timeout = options.timeout ?? 7_200_000

    const handle = watchWithdrawal(provider, options, event => {
      if (event.status === 'claimable') {
        handle.unsubscribe()
        if (timer) clearTimeout(timer)
        resolve(event)
      }
    })

    const timer = setTimeout(() => {
      handle.unsubscribe()
      reject(new Error(`waitForClaimable timed out after ${timeout}ms`))
    }, timeout)
  })
}
