/**
 * Service presets — barrel re-export + generic resolver.
 *
 * Existing imports (`from './services'`) resolve here after the split.
 * Each per-chain file imports only its own @buf/* packages.
 */

import type { DescService } from '@bufbuild/protobuf'
import type { ChainInfo } from '../../provider/types'
import type { ChainType } from '../types'
import { InitiaServices } from './initia'
import { MinievmServices } from './minievm'
import { MiniwasmServices } from './miniwasm'
import { MinimoveServices } from './minimove'
import { OtherServices } from './other'

export { InitiaServices, MinievmServices, MiniwasmServices, MinimoveServices, OtherServices }

export function getServiceRegistry(chainType: ChainType) {
  switch (chainType) {
    case 'initia':
      return InitiaServices
    case 'minievm':
      return MinievmServices
    case 'miniwasm':
      return MiniwasmServices
    case 'minimove':
      return MinimoveServices
    default:
      return OtherServices
  }
}

/** Resolve services for a chain. Used by generic entry-point factories. */
export function getServicesForChain(chainInfo: ChainInfo): Record<string, DescService> {
  return getServiceRegistry(chainInfo.chainType).getServices(chainInfo.network)
}
