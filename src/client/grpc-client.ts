/**
 * Proxy-based lazy gRPC client factory.
 *
 * Creates clients on-demand when first accessed, caching them for reuse.
 * Optionally wraps methods to inject auth/headers and convert auth errors.
 */

import {
  createClient,
  ConnectError,
  Code,
  type Client,
  type CallOptions,
} from '@connectrpc/connect'
import type { Transport } from '@connectrpc/connect'
import type { DescMessage, DescService } from '@bufbuild/protobuf'
import { AuthenticationError } from '../errors'
import { toCallOptions } from './headers'
import { wrapResponse } from './response'
import type { WrapReturnType } from './response'
import type { AuthConfig, QueryOptions } from './types'

/**
 * Maps a Connect RPC Client's methods to accept QueryOptions instead of CallOptions.
 * Unary methods return WrappedResponse (with schema, typeUrl, toJson()).
 */
export type QueryClient<S extends DescService> = {
  [M in keyof Client<S>]: Client<S>[M] extends (
    request: infer R,
    options?: CallOptions
  ) => infer Ret
    ? (request: R, options?: QueryOptions) => WrapReturnType<Ret>
    : Client<S>[M]
}

/**
 * Maps service descriptors to their query-wrapped client types.
 */
export type ServiceClients<T extends Record<string, DescService>> = {
  [K in keyof T]: QueryClient<T[K]>
}

/**
 * Wrap a service client to:
 * - Inject auth/headers via toCallOptions()
 * - Convert ConnectError (Unauthenticated/PermissionDenied) to AuthenticationError
 * - Wrap **unary** responses with WrappedResponse (schema, typeUrl, toJson);
 *   streaming responses pass through unchanged
 */
function createServiceProxy<S extends DescService>(
  service: S,
  serviceClient: Client<S>,
  contextAuth: AuthConfig | undefined,
  contextHeaders: Record<string, string> | undefined
): QueryClient<S> {
  return new Proxy(serviceClient as unknown as QueryClient<S>, {
    get(target, methodName: string | symbol, receiver) {
      if (typeof methodName !== 'string') return Reflect.get(target, methodName, receiver)

      const original = (serviceClient as Record<string, unknown>)[methodName]
      if (typeof original !== 'function') return original

      // Hoist method lookup: resolve output schema once per method access
      const method = (service.method as Record<string, { methodKind: string; output: unknown }>)[
        methodName
      ]
      const outputSchema =
        method?.methodKind === 'unary' ? (method.output as DescMessage) : undefined

      return async (request: unknown, queryOptions?: QueryOptions) => {
        const callOptions = toCallOptions(contextAuth, contextHeaders, queryOptions)
        try {
          const result = await (original.call(
            serviceClient,
            request,
            callOptions
          ) as Promise<unknown>)

          // Wrap unary response with pre-resolved output schema
          if (outputSchema && result != null && typeof result === 'object') {
            return wrapResponse(outputSchema, result)
          }
          return result
        } catch (error) {
          if (error instanceof ConnectError) {
            if (error.code === Code.Unauthenticated || error.code === Code.PermissionDenied) {
              throw new AuthenticationError(
                error.code === Code.Unauthenticated ? 401 : 403,
                error.message
              )
            }
          }
          throw error
        }
      }
    },
  })
}

/**
 * Creates a proxy-based lazy gRPC client.
 *
 * Clients are created on first access and cached for subsequent calls.
 * When `contextAuth` or `contextHeaders` are provided, each service client
 * is wrapped with a proxy that injects auth/headers via `toCallOptions()`.
 *
 * @param transport - The connect transport (gRPC-web, gRPC, etc.)
 * @param services - Map of service names to service descriptors
 * @param contextAuth - Context-level auth config (injected into every request)
 * @param contextHeaders - Context-level headers (injected into every request)
 * @param typeRegistry - Protobuf type registry for google.protobuf.Any serialization (passed to wrapResponse)
 * @returns Proxy object with lazy-initialized clients
 *
 * @example
 * ```typescript
 * const services = InitiaServices.getServices('mainnet')
 * const client = createGrpcClient(transport, services, auth.apiKey('key'))
 *
 * // Clients are created lazily on first access
 * const balance = await client.bank.balance({ address, denom: 'uinit' })
 * ```
 */
export function createGrpcClient<T extends Record<string, DescService>>(
  transport: Transport,
  services: T,
  contextAuth?: AuthConfig,
  contextHeaders?: Record<string, string>
): ServiceClients<T> {
  const cache: Partial<Record<keyof T, QueryClient<DescService>>> = {}

  return new Proxy({} as ServiceClients<T>, {
    get(_, prop: string | symbol) {
      // Only handle string keys that exist in services
      if (typeof prop !== 'string' || !(prop in services)) {
        return undefined
      }

      const key = prop as keyof T

      // Create client on first access, wrap with service proxy
      if (!(key in cache)) {
        const rawClient = createClient(services[key], transport)
        cache[key] = createServiceProxy(
          services[key],
          rawClient,
          contextAuth,
          contextHeaders
        ) as QueryClient<DescService>
      }

      return cache[key]
    },

    has(_, prop: string | symbol) {
      return typeof prop === 'string' && prop in services
    },

    ownKeys() {
      return Object.keys(services)
    },

    getOwnPropertyDescriptor(_, prop: string | symbol) {
      if (typeof prop === 'string' && prop in services) {
        return {
          enumerable: true,
          configurable: true,
        }
      }
      return undefined
    },
  })
}
