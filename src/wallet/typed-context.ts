/**
 * Typed ChainContext factory helpers.
 *
 * Provides chain-type-specific convenience functions that eliminate
 * generic type parameters and optionally bundle provider creation:
 *
 * ```typescript
 * // All-in-one (async — creates provider internally)
 * const ctx = await createInitiaContext({ network: 'testnet', signer: key })
 *
 * // Provider reuse (sync)
 * const ctx = createInitiaContext(provider, 'initiation-2', { signer: key })
 *
 * // Direct chainInfo (sync)
 * const ctx = createInitiaContext(chainInfo, { signer: key })
 * ```
 */

import type { DescService } from '@bufbuild/protobuf'
import type { Transport } from '@connectrpc/connect'
import type { ChainInfoProvider, ChainInfoForType, ChainInfo } from '../provider/types'
import type { ChainType } from '../client/types'
import type { TransportOptions } from '../client/transport-common'
import type { MsgsForChain } from '../msgs/types'
import type { ChainConfigBuilder } from '../chain-config'
import {
  buildChainContextFactory,
  type ChainContext,
  type ChainContextOptions,
  type TokenResolver,
  type EnricherFactory,
} from './chain-context'

// =============================================================================
// Constants
// =============================================================================

/** Default L1 chain IDs per network. L2 chains have no default. */
export const L1_CHAIN_IDS: Record<string, string> = {
  mainnet: 'interwoven-1',
  testnet: 'initiation-2',
}

// =============================================================================
// Types
// =============================================================================

/**
 * Options for typed context creation (all-in-one mode).
 *
 * Resolution priority:
 * 1. `provider` + `chainId` → uses existing provider
 * 2. `network` (+ optional `chainId`) → creates RegistryProvider internally
 */
export interface TypedContextOptions extends ChainContextOptions {
  /** Network (creates RegistryProvider internally if no provider given) */
  network?: 'mainnet' | 'testnet'
  /** Chain ID (required for L2; for Initia L1, auto-inferred from network) */
  chainId?: string
  /** Existing provider (skips internal provider creation) */
  provider?: ChainInfoProvider
}

/**
 * Overloaded factory function type for typed context creation.
 */
export interface TypedContextFactory<T extends ChainType> {
  /** Create from ChainInfo with JSON-RPC EVM transport (sync). */
  (
    chainInfo: ChainInfoForType<T>,
    options: ChainContextOptions & { evmTransport: 'jsonrpc' }
  ): ChainContext<T> & { evmTransport: 'jsonrpc' }
  /** Create from ChainInfo directly (sync). */
  (chainInfo: ChainInfoForType<T>, options?: ChainContextOptions): ChainContext<T>
  /** Create from provider + chainId with JSON-RPC EVM transport (sync). */
  (
    provider: ChainInfoProvider,
    chainId: string,
    options: ChainContextOptions & { evmTransport: 'jsonrpc' }
  ): ChainContext<T> & { evmTransport: 'jsonrpc' }
  /** Create from provider + chainId (sync). */
  (provider: ChainInfoProvider, chainId: string, options?: ChainContextOptions): ChainContext<T>
  /** Create from options object with JSON-RPC EVM transport (async). */
  (
    options: TypedContextOptions & { evmTransport: 'jsonrpc' }
  ): Promise<ChainContext<T> & { evmTransport: 'jsonrpc' }>
  /** Create from options object — may create provider internally (async). */
  (options: TypedContextOptions): Promise<ChainContext<T>>
}

/**
 * Options for buildTypedFactory.
 */
export interface TypedFactoryOptions {
  /** Resolve default chain ID for a network (used by Initia L1). */
  getDefaultChainId?: (network: string) => string | undefined
  /** Token resolver injected into ChainContext for getTokenContract(). */
  tokenResolver?: TokenResolver
  /** Enricher factory for VM-aware tx decoding (injected per chain type). */
  enricherFactory?: EnricherFactory
}

// =============================================================================
// Factory Builder
// =============================================================================

function isChainInfo(obj: unknown): obj is ChainInfo {
  return typeof obj === 'object' && obj !== null && 'chainType' in obj && 'chainId' in obj
}

/**
 * Build a typed ChainContext factory for a specific chain type.
 *
 * Each factory creates its own internal `createChainContext` wired with
 * chain-specific services and message builders, enabling tree-shaking
 * of unused chain types.
 *
 * @param chainType - The chain type this factory handles
 * @param createTransport - Platform-specific transport creator
 * @param chainConfig - ChainConfigBuilder for this chain type
 * @param options - Additional options (e.g., getDefaultChainId for L1)
 *
 * @example
 * ```typescript
 * export const createInitiaContext = buildTypedFactory(
 *   'initia', createTransport, initiaChain,
 *   { getDefaultChainId: n => L1_CHAIN_IDS[n] }
 * )
 * ```
 */
export function buildTypedFactory<T extends ChainType>(
  chainType: T,
  createTransport: (chainInfo: ChainInfo, options?: TransportOptions) => Transport,
  chainConfig: ChainConfigBuilder<any, any>,
  options?: TypedFactoryOptions
): TypedContextFactory<T> {
  const getDefaultChainId = options?.getDefaultChainId

  // Build default config once — services, msgs, and registry are derived from it
  const defaultConfig = chainConfig.build()
  const typeRegistry = defaultConfig.registry
  const msgs = defaultConfig.msgs as unknown as MsgsForChain<T>

  const create = buildChainContextFactory(
    createTransport,
    chainInfo => {
      // For network-specific builds, use the network; otherwise use default config
      const config = chainInfo.network ? chainConfig.build(chainInfo.network) : defaultConfig
      return config.services as Record<string, DescService>
    },
    () => msgs as MsgsForChain<ChainType>,
    {
      tokenResolver: options?.tokenResolver,
      enricherFactory: options?.enricherFactory,
      getTypeRegistry: () => typeRegistry,
    }
  )

  function resolveChainId(network?: string, chainId?: string): string {
    const resolved = chainId ?? (network ? getDefaultChainId?.(network) : undefined)
    if (!resolved) {
      throw new Error(
        `chainId is required for ${chainType} context` +
          (network ? ` (no default for network '${network}')` : '')
      )
    }
    return resolved
  }

  function createFromProvider(
    provider: ChainInfoProvider,
    chainId: string,
    ctxOptions?: ChainContextOptions
  ): ChainContext<T> {
    const chainInfo = provider.getChainInfo<T>(chainId)
    if (!chainInfo) throw new Error(`Chain '${chainId}' not found in provider`)
    return create(chainInfo, ctxOptions)
  }

  function factory(
    first: ChainInfoForType<T> | ChainInfoProvider | TypedContextOptions,
    second?: string | ChainContextOptions,
    third?: ChainContextOptions
  ): ChainContext<T> | Promise<ChainContext<T>> {
    // Overload: provider + chainId (sync)
    if (typeof second === 'string') {
      return createFromProvider(first as ChainInfoProvider, second, third)
    }

    // Overload: direct chainInfo (sync)
    if (isChainInfo(first)) {
      return create(first, second)
    }

    // Overload: options object (async)
    const { network, chainId, provider, ...contextOptions } = first as TypedContextOptions

    if (provider) {
      const id = resolveChainId(network, chainId)
      return Promise.resolve(createFromProvider(provider, id, contextOptions))
    }

    if (!network) {
      throw new Error('One of network, provider, or chainInfo (via overload) is required')
    }

    const id = resolveChainId(network, chainId)
    // Dynamic import keeps registry-provider (and its bridge dependency) out of
    // the static import graph, enabling tree-shaking of unused chain services.
    return import('../provider/registry-provider').then(({ createRegistryProvider }) =>
      createRegistryProvider({ network }).then(prov => {
        const info = prov.getChainInfo<T>(id)
        if (!info) throw new Error(`Chain '${id}' not found in ${network} registry`)
        return create(info, contextOptions)
      })
    )
  }

  return factory as TypedContextFactory<T>
}
