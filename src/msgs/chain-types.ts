/**
 * Backward-compatible chain message types derived from ChainConfigBuilder.
 *
 * These are computed from the chain config builders rather than manually
 * maintained interface hierarchies. Kept in a separate file to avoid
 * circular dependencies: chain-config.ts → msgs/types.ts → chains/*.ts → chain-config.ts.
 */

import type { initiaChain } from '../chains/initia'
import type { minievmChain } from '../chains/minievm'
import type { minimoveChain } from '../chains/minimove'
import type { miniwasmChain } from '../chains/miniwasm'
import type { CoreMsgMethods } from '../chain-config'
import type { ChainType } from '../client/types'

/**
 * Message builders for Initia L1.
 * @deprecated Use `ReturnType<typeof initiaChain.build>['msgs']` directly for full type inference.
 */
export type InitiaMsgs = ReturnType<typeof initiaChain.build>['msgs']

/**
 * Message builders for Minievm rollup.
 * @deprecated Use `ReturnType<typeof minievmChain.build>['msgs']` directly for full type inference.
 */
export type MinievmMsgs = ReturnType<typeof minievmChain.build>['msgs']

/**
 * Message builders for Minimove rollup.
 * @deprecated Use `ReturnType<typeof minimoveChain.build>['msgs']` directly for full type inference.
 */
export type MinimoveMsgs = ReturnType<typeof minimoveChain.build>['msgs']

/**
 * Message builders for Miniwasm rollup.
 * @deprecated Use `ReturnType<typeof miniwasmChain.build>['msgs']` directly for full type inference.
 */
export type MiniwasmMsgs = ReturnType<typeof miniwasmChain.build>['msgs']

/**
 * Base message builders for generic Cosmos SDK chains.
 */
export type BaseMsgs = CoreMsgMethods

interface MsgsMap {
  initia: InitiaMsgs
  minievm: MinievmMsgs
  minimove: MinimoveMsgs
  miniwasm: MiniwasmMsgs
  other: BaseMsgs
}

/**
 * Map a chain type to its message builders type.
 */
export type MsgsForChain<T extends ChainType> = MsgsMap[T]
