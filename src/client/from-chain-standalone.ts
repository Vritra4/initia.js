/**
 * Bridge-internal standalone fromChain.
 *
 * Wires buildFromChain with all chain services and gRPC-web transport.
 * Services are imported here (not in from-chain.ts) to preserve the
 * tree-shaking boundary — importing buildFromChain alone does NOT
 * pull in any chain service modules.
 */

import { buildFromChain } from './from-chain'
import { getServicesForChain, getTypeRegistryForChain } from './services'
import { createTransport } from './transport.browser'

export const fromChain = buildFromChain(
  createTransport,
  getServicesForChain,
  getTypeRegistryForChain
)
