/**
 * Message builders module.
 *
 * Provides chain-specific message builders with custom module injection support.
 */

import type { ChainType } from '../client/types'
import type { MsgsForChain, WithSchemas } from './types'
import { InitiaError, ValidationError } from '../errors'
import type { DescMessage } from '@bufbuild/protobuf'
import type { ModuleDefinition } from './module-helpers'
import { createDecode } from './decode'

const RESERVED_NAMES = new Set(['custom', 'decode', '_schemas'])

import { baseMsgs } from './base'
import { initiaMsgs } from './initia'
import { minimoveMsgs } from './minimove'
import { miniwasmMsgs } from './miniwasm'
import { minievmMsgs } from './minievm'

/**
 * Create message builders for a specific chain type.
 * Supports custom module injection for extending or overriding default modules.
 */
export function createMsgs<T extends ChainType>(chainType: T): MsgsForChain<T>
export function createMsgs<T extends ChainType, M extends Record<string, ModuleDefinition>>(
  chainType: T,
  options: { modules: M }
): Omit<MsgsForChain<T>, keyof M> & { [K in keyof M]: M[K]['builders'] }
export function createMsgs(
  chainType: ChainType,
  options?: { modules?: Record<string, ModuleDefinition> }
): MsgsForChain<ChainType> {
  let base: WithSchemas<MsgsForChain<ChainType>>
  switch (chainType) {
    case 'initia':
      base = initiaMsgs
      break
    case 'minimove':
      base = minimoveMsgs
      break
    case 'miniwasm':
      base = miniwasmMsgs
      break
    case 'minievm':
      base = minievmMsgs
      break
    case 'other':
      base = baseMsgs
      break
    default:
      throw new InitiaError(
        `Unknown chain type "${chainType as string}". Use 'other' with module injection for custom chains.`
      )
  }

  if (!options?.modules || Object.keys(options.modules).length === 0) {
    return base
  }

  const customSchemas: DescMessage[] = []
  const customBuilders: Record<string, unknown> = {}
  for (const [name, mod] of Object.entries(options.modules)) {
    if (RESERVED_NAMES.has(name)) {
      throw new InitiaError(`Module name "${name}" is reserved and cannot be overridden.`)
    }
    if (!Array.isArray(mod.schemas) || typeof mod.builders !== 'object' || mod.builders === null) {
      throw new ValidationError(
        name,
        `Module "${name}" must have an array of schemas and an object of builders. Use defineModule() for validation.`
      )
    }
    customSchemas.push(...mod.schemas)
    customBuilders[name] = mod.builders
  }

  const allSchemas = [...base._schemas, ...customSchemas]
  const decode = createDecode(allSchemas)

  // The overload return type (Omit<MsgsForChain<T>, keyof M> & { [K in keyof M]: ... })
  // is dynamically computed from M, which TypeScript cannot prove from a runtime spread.
  // Type safety is enforced by the overload signatures, not the implementation body.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
  return { ...base, ...customBuilders, decode, _schemas: allSchemas } as any
}

// Re-export chain compositions
export { baseMsgs, initiaMsgs, minimoveMsgs, miniwasmMsgs, minievmMsgs }

// Re-export presets
export { testnetModules } from './presets'

// Re-export module helpers
export { defineModule, type ModuleDefinition } from './module-helpers'

// Re-export Message class (value) and core types
export {
  Message,
  msg,
  isMessageOf,
  type FriendlyInit,
  type FriendlyCustomInit,
  type WithDefaults,
} from './types'
export type {
  JsonMsg,
  MsgInput,
  BaseMsgs,
  InitiaMsgs,
  MinimoveMsgs,
  MiniwasmMsgs,
  MinievmMsgs,
  MsgsForChain,
} from './types'

// Re-export coin/bytes helpers
export { toProtoCoin, toProtoCoins, hexToBytes } from './types'

// Re-export decode
export { createDecode } from './decode'
