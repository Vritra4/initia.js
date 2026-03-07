/**
 * Client factory - Create gRPC clients from chain info and transport.
 */

import type { Transport } from '@connectrpc/connect'
import type { ChainInfo, ChainInfoForType } from '../provider/types'
import { createGrpcClient } from './grpc-client'
import { wrapClientWithCache } from './cached-client'
import { getServiceRegistry } from './services'
import type {
  AuthConfig,
  Client,
  InitiaClient,
  MinievmClient,
  MiniwasmClient,
  MinimoveClient,
  BaseClient,
} from './types'

/**
 * Create a gRPC client from chain info and an existing transport.
 *
 * Use this when you need custom transport configuration or want to
 * share a transport across multiple clients.
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
  const registry = getServiceRegistry(chainInfo.chainType)
  const services = registry.getServices(chainInfo.network)

  // Type assertion is safe here because:
  // 1. getServiceRegistry returns the correct service set for the chain type
  // 2. createGrpcClient creates clients matching the service set
  // 3. The function overloads guarantee the correct return type based on input
  const client = createGrpcClient(transport, services, contextAuth, contextHeaders) as Client
  return wrapClientWithCache(client, chainInfo.chainId)
}
