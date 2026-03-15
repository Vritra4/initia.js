/**
 * Bridge-internal standalone fromChain.
 *
 * Wires buildFromChain with all chain services and gRPC-web transport.
 * Services are imported here (not in from-chain.ts) to preserve the
 * tree-shaking boundary — importing buildFromChain alone does NOT
 * pull in any chain service modules.
 */

import type { DescService } from '@bufbuild/protobuf'
import { buildFromChain } from './from-chain'
import { createTransport } from './transport.browser'
import { initiaChain } from '../chains/initia'
import { minievmChain } from '../chains/minievm'
import { minimoveChain } from '../chains/minimove'
import { miniwasmChain } from '../chains/miniwasm'
import { createBaseConfig } from '../chains/common'
import type { ChainConfigBuilder } from '../chain-config'

const chainConfigs: Record<string, ChainConfigBuilder<any, any>> = {
  initia: initiaChain,
  minievm: minievmChain,
  minimove: minimoveChain,
  miniwasm: miniwasmChain,
}

export const fromChain = buildFromChain(
  createTransport,
  chainInfo => {
    const config = chainConfigs[chainInfo.chainType as keyof typeof chainConfigs]
    if (!config) return createBaseConfig().build().services as Record<string, DescService>
    const built = chainInfo.network ? config.build(chainInfo.network) : config.build()
    return built.services as Record<string, DescService>
  },
  chainInfo => {
    const config = chainConfigs[chainInfo.chainType as keyof typeof chainConfigs]
    if (!config) return createBaseConfig().build().registry
    const built = chainInfo.network ? config.build(chainInfo.network) : config.build()
    return built.registry
  }
)
