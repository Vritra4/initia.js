/**
 * Client factory - Create gRPC clients from chain info and transport.
 */

import type { DescService } from '@bufbuild/protobuf'
import type { Transport } from '@connectrpc/connect'
import type { ChainInfo, ChainInfoForType } from '../provider/types'
import { createGrpcClient } from './grpc-client'
import { wrapClientWithCache } from './cached-client'
import type { ChainConfigBuilder } from '../chain-config'
import { initiaChain } from '../chains/initia'
import { minievmChain } from '../chains/minievm'
import { minimoveChain } from '../chains/minimove'
import { miniwasmChain } from '../chains/miniwasm'
import { createBaseConfig } from '../chains/common'
import type {
  AuthConfig,
  Client,
  ChainType,
  InitiaClient,
  MinievmClient,
  MiniwasmClient,
  MinimoveClient,
  BaseClient,
} from './types'

const chainConfigs: Record<string, ChainConfigBuilder<any, any>> = {
  initia: initiaChain,
  minievm: minievmChain,
  minimove: minimoveChain,
  miniwasm: miniwasmChain,
}

function getServicesAndRegistry(chainType: ChainType, network: string) {
  const config = chainConfigs[chainType]
  if (!config) {
    const base = createBaseConfig().build()
    return { services: base.services as Record<string, DescService>, typeRegistry: base.registry }
  }
  const built = config.build(network)
  return { services: built.services as Record<string, DescService>, typeRegistry: built.registry }
}

/**
 * Create a gRPC client from chain info and an existing transport.
 *
 * Use this when you need custom transport configuration or want to
 * share a transport across multiple clients. Automatically provides a
 * protobuf type registry for google.protobuf.Any serialization based
 * on the chain type.
 *
 * The return type is automatically inferred based on the chain type:
 * - 'initia' → InitiaClient
 * - 'minievm' → MinievmClient
 * - 'miniwasm' → MiniwasmClient
 * - 'minimove' → MinimoveClient
 * - 'other' → BaseClient
 *
 * @param chainInfo - Chain configuration (for service selection)
 * @param transport - Pre-configured transport instance
 * @param contextAuth - Context-level auth config (injected into every request)
 * @param contextHeaders - Context-level headers (injected into every request)
 * @returns gRPC client with chain-appropriate services
 *
 * @example
 * ```typescript
 * // Type is automatically inferred when chainType is narrowed
 * if (chainInfo.chainType === 'minievm') {
 *   const client = createClientWithTransport(chainInfo, transport)
 *   // client: MinievmClient - has .evm service
 *   const result = await client.evm.call(...)
 * }
 * ```
 */
export function createClientWithTransport(
  chainInfo: ChainInfoForType<'initia'>,
  transport: Transport,
  contextAuth?: AuthConfig,
  contextHeaders?: Record<string, string>
): InitiaClient
export function createClientWithTransport(
  chainInfo: ChainInfoForType<'minievm'>,
  transport: Transport,
  contextAuth?: AuthConfig,
  contextHeaders?: Record<string, string>
): MinievmClient
export function createClientWithTransport(
  chainInfo: ChainInfoForType<'miniwasm'>,
  transport: Transport,
  contextAuth?: AuthConfig,
  contextHeaders?: Record<string, string>
): MiniwasmClient
export function createClientWithTransport(
  chainInfo: ChainInfoForType<'minimove'>,
  transport: Transport,
  contextAuth?: AuthConfig,
  contextHeaders?: Record<string, string>
): MinimoveClient
export function createClientWithTransport(
  chainInfo: ChainInfoForType<'other'>,
  transport: Transport,
  contextAuth?: AuthConfig,
  contextHeaders?: Record<string, string>
): BaseClient
export function createClientWithTransport(
  chainInfo: ChainInfo,
  transport: Transport,
  contextAuth?: AuthConfig,
  contextHeaders?: Record<string, string>
): Client
export function createClientWithTransport(
  chainInfo: ChainInfo,
  transport: Transport,
  contextAuth?: AuthConfig,
  contextHeaders?: Record<string, string>
): Client {
  const { services, typeRegistry } = getServicesAndRegistry(chainInfo.chainType, chainInfo.network)

  // Type assertion is safe here because:
  // 1. getServicesAndRegistry returns the correct service set for the chain type
  // 2. createGrpcClient creates clients matching the service set
  // 3. The function overloads guarantee the correct return type based on input
  const client = createGrpcClient(
    transport,
    services,
    contextAuth,
    contextHeaders,
    typeRegistry
  ) as unknown as Client
  return wrapClientWithCache(client, chainInfo.chainId)
}
