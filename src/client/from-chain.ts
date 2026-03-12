/**
 * Factory for creating platform-specific `fromChain` functions.
 *
 * This module contains only `buildFromChain` and shared types.
 * No services are imported here — they are injected via `getServices` parameter,
 * ensuring that importing `buildFromChain` does not pull in all chain service modules.
 *
 * For the standalone `fromChain` (used by bridge modules internally),
 * see `from-chain-standalone.ts`.
 *
 * @see buildChainContextFactory — Same injection pattern for createChainContext
 */

import type { Transport } from '@connectrpc/connect'
import type { DescService, Registry } from '@bufbuild/protobuf'
import type { ChainInfo, ChainInfoProvider } from '../provider/types'
import { createGrpcClient } from './grpc-client'
import { wrapClientWithCache } from './cached-client'
import type { TransportOptions } from './transport-common'
import type {
  NetworkType,
  BaseClient,
  InitiaClient,
  MinievmClient,
  MiniwasmClient,
  MinimoveClient,
  Client,
} from './types'
import type { CachedClient } from './cached-client'

/**
 * Options for fromChain helper.
 */
export interface FromChainOptions {
  /** Chain info provider (required at runtime). Use createRegistryProvider(), createLocalRegistryProvider(), or CustomProvider. */
  provider?: ChainInfoProvider
  /** Custom transport (overrides endpoint from chain info) */
  transport?: Transport
}

/**
 * Base result fields for fromChain helper.
 */
interface FromChainResultBase {
  /** Chain ID */
  chainId: string
  /** Network type */
  network: NetworkType
}

/**
 * Result type for Initia L1 chain.
 */
export interface FromChainResultInitia extends FromChainResultBase {
  chainType: 'initia'
  client: InitiaClient & CachedClient
}

/**
 * Result type for Minievm rollup chain.
 */
export interface FromChainResultMinievm extends FromChainResultBase {
  chainType: 'minievm'
  client: MinievmClient & CachedClient
}

/**
 * Result type for Miniwasm rollup chain.
 */
export interface FromChainResultMiniwasm extends FromChainResultBase {
  chainType: 'miniwasm'
  client: MiniwasmClient & CachedClient
}

/**
 * Result type for Minimove rollup chain.
 */
export interface FromChainResultMinimove extends FromChainResultBase {
  chainType: 'minimove'
  client: MinimoveClient & CachedClient
}

/**
 * Result type for other Cosmos SDK chains.
 */
export interface FromChainResultOther extends FromChainResultBase {
  chainType: 'other'
  client: BaseClient & CachedClient
}

/**
 * Result of fromChain helper - discriminated union by chainType.
 *
 * Use chainType to narrow the result and get the correct client type:
 * ```typescript
 * const result = fromChain('minimove-1')
 * if (result.chainType === 'minimove') {
 *   result.client.move // ✅ TypeScript knows this is MinimoveClient
 * }
 * ```
 */
export type FromChainResult =
  | FromChainResultInitia
  | FromChainResultMinievm
  | FromChainResultMiniwasm
  | FromChainResultMinimove
  | FromChainResultOther

/**
 * Build a platform-specific `fromChain` function.
 *
 * This factory injects the transport creator (Node.js gRPC or browser gRPC-web)
 * and service resolver so that the public API uses the optimal transport for
 * the runtime environment without statically importing all chain services.
 *
 * @param createTransport - Platform-specific transport creator
 * @param getServices - Resolves ChainInfo to service descriptors
 * @param getTypeRegistry - Optional resolver for protobuf type registry.
 *   When omitted, toJson() will fail on responses containing google.protobuf.Any fields.
 * @returns `fromChain` function bound to the given transport and services
 *
 * @see buildChainContextFactory — Same pattern for createChainContext
 */
export function buildFromChain(
  createTransport: (chainInfo: ChainInfo, options?: TransportOptions) => Transport,
  getServices: (chainInfo: ChainInfo) => Record<string, DescService>,
  getTypeRegistry?: (chainInfo: ChainInfo) => Registry
) {
  return function fromChain(chainId: string, options: FromChainOptions = {}): FromChainResult {
    if (!options.provider) {
      throw new Error(
        'No provider specified. Use one of:\n' +
          '  - createLocalRegistryProvider({ registryPath }) for offline (Node.js)\n' +
          '  - await createRegistryProvider() for online Registry\n' +
          '  - new CustomProvider([...]) for custom chains'
      )
    }
    const provider = options.provider

    const chainInfo = provider.getChainInfo(chainId)
    if (!chainInfo) {
      throw new Error(`Chain not found: ${chainId}`)
    }

    const services = getServices(chainInfo)
    const transport = options.transport ?? createTransport(chainInfo)
    const typeRegistry = getTypeRegistry?.(chainInfo)

    // Cast through unknown: createGrpcClient returns ServiceClients<Record<string, DescService>>
    // which is structurally correct but too wide for TypeScript to narrow automatically.
    const rawClient = createGrpcClient(
      transport,
      services,
      undefined,
      undefined,
      typeRegistry
    ) as unknown as Client
    const client = wrapClientWithCache(rawClient, chainInfo.chainId)

    return {
      client,
      chainId: chainInfo.chainId,
      chainType: chainInfo.chainType,
      network: chainInfo.network,
    } as FromChainResult
  }
}
