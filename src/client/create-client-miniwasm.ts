import type { Transport } from '@connectrpc/connect'
import type { ChainInfo } from '../provider/types'
import type { MiniwasmClient, AuthConfig } from './types'
import { miniwasmChain } from '../chains/miniwasm'
import { createGrpcClient } from './grpc-client'
import { wrapClientWithCache } from './cached-client'

export function createClientWithConfig(
  chainInfo: ChainInfo,
  transport: Transport,
  contextAuth?: AuthConfig,
  contextHeaders?: Record<string, string>,
): MiniwasmClient {
  const config = miniwasmChain.build(chainInfo.network)
  const client = createGrpcClient(
    transport,
    config.services as Record<string, any>,
    contextAuth,
    contextHeaders,
    config.registry,
  )
  return wrapClientWithCache(client as any, chainInfo.chainId) as unknown as MiniwasmClient
}
