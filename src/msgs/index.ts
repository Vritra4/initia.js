/**
 * Message builders module.
 *
 * Provides chain-specific message builders for all supported chain types.
 */

import type { ChainType } from '../client/types'
import type { MsgsForChain } from './types'

// Chain-specific message builders
import { baseMsgs } from './base'
import { initiaMsgs } from './initia'
import { minimoveMsgs } from './minimove'
import { miniwasmMsgs } from './miniwasm'
import { minievmMsgs } from './minievm'

/**
 * Create message builders for a specific chain type.
 *
 * @param chainType - The chain type
 * @returns Message builders appropriate for the chain
 *
 * @example
 * ```ts
 * const msgs = createMsgs('initia')
 * const sendMsg = msgs.send(from, to, amount)
 * const delegateMsg = msgs.delegate(delegator, validator, amount)
 * ```
 */
export function createMsgs<T extends ChainType>(chainType: T): MsgsForChain<T> {
  switch (chainType) {
    case 'initia':
      return initiaMsgs as MsgsForChain<T>
    case 'minimove':
      return minimoveMsgs as MsgsForChain<T>
    case 'miniwasm':
      return miniwasmMsgs as MsgsForChain<T>
    case 'minievm':
      return minievmMsgs as MsgsForChain<T>
    default:
      return baseMsgs as MsgsForChain<T>
  }
}

// Re-export individual message builders
export { baseMsgs, initiaMsgs, minimoveMsgs, miniwasmMsgs, minievmMsgs }

// Re-export Message class (value) and types
export { Message } from './types'
export type {
  JsonMsg,
  MsgInput,
  BaseMsgs,
  InitiaMsgs,
  MinimoveMsgs,
  MiniwasmMsgs,
  MinievmMsgs,
  MsgsForChain,
  IbcTransferOptions,
  SendInput,
  TransferInput,
  DelegateInput,
  RedelegateInput,
  MoveExecuteInput,
  AllowanceOptions,
  GroupMember,
} from './types'
