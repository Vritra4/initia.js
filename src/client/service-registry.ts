/**
 * Service Registry for dynamic service registration with type inference.
 *
 * Supports network-specific overrides with full type safety.
 */

import type {
  DescEnum,
  DescExtension,
  DescFile,
  DescMessage,
  DescService,
  Registry,
} from '@bufbuild/protobuf'
import { createRegistry } from '@bufbuild/protobuf'

/**
 * Override utility: Replace existing keys with new types.
 * Uses Omit to remove keys before intersection.
 */
type Override<
  Base extends Record<string, unknown>,
  Overrides extends Record<string, unknown>,
> = Omit<Base, keyof Overrides> & Overrides

/**
 * Resolve services for a specific network.
 * - If network has overrides: merge default + overrides
 * - Otherwise: return default services
 */
type ResolveServices<
  TDefault extends Record<string, DescService>,
  TNetworks extends Record<string, Record<string, DescService>>,
  N extends string,
> = N extends keyof TNetworks ? Override<TDefault, TNetworks[N]> : TDefault

/**
 * Builder for dynamic service registration with type inference.
 *
 * @example
 * ```typescript
 * const registry = createServiceRegistry()
 *   .addModule('auth', AuthQuery)
 *   .addModule('bank', BankQuery, file_cosmos_bank_v1beta1_tx)
 *   .forNetwork('testnet').addModule('gov', GovV1Beta1Query)
 *
 * registry.getServices()          // { auth, gov: GovV1Query }
 * registry.getServices('testnet') // { auth, gov: GovV1Beta1Query }
 * ```
 */
export class ServiceRegistryBuilder<
  TDefault extends Record<string, DescService> = Record<string, never>,
  TNetworks extends Record<string, Record<string, DescService>> = Record<string, never>,
> {
  private defaultServices: Record<string, DescService> = {}
  private networkOverrides: Record<string, Record<string, DescService>> = {}
  private typeInputs: (
    | Registry
    | DescFile
    | DescMessage
    | DescEnum
    | DescExtension
    | DescService
  )[] = []
  private cachedRegistry: Registry | null = null

  /**
   * Add a module with its query service and optional type descriptors.
   */
  addModule<K extends string, S extends DescService>(
    name: K,
    service: S,
    ...types: (Registry | DescFile | DescMessage | DescEnum | DescExtension | DescService)[]
  ): ServiceRegistryBuilder<Override<TDefault, Record<K, S>>, TNetworks> {
    this.defaultServices[name] = service
    if (types.length > 0) {
      this.typeInputs.push(...types)
      this.cachedRegistry = null
    }
    // Builder pattern: TypeScript cannot track `this` type evolution through
    // mutations. The cast is safe because we're returning the same instance
    // with updated generic types that reflect the accumulated services.
    return this as unknown as ServiceRegistryBuilder<Override<TDefault, Record<K, S>>, TNetworks>
  }

  /**
   * Define network-specific overrides.
   */
  forNetwork<N extends string>(network: N) {
    type ExistingOverrides = N extends keyof TNetworks ? TNetworks[N] : Record<string, never>

    return {
      /**
       * Override a module's service for this network.
       */
      addModule: <K extends string, S extends DescService>(
        name: K,
        service: S
      ): ServiceRegistryBuilder<
        TDefault,
        Omit<TNetworks, N> & Record<N, ExistingOverrides & Record<K, S>>
      > => {
        if (!this.networkOverrides[network]) {
          this.networkOverrides[network] = {}
        }
        this.networkOverrides[network][name] = service
        // Builder pattern: Same reasoning as addModule() above. The cast reflects
        // the accumulated network-specific service overrides in the type system.
        return this as unknown as ServiceRegistryBuilder<
          TDefault,
          Omit<TNetworks, N> & Record<N, ExistingOverrides & Record<K, S>>
        >
      },
    }
  }

  /**
   * Get merged services for a network.
   * Returns default services merged with network-specific overrides.
   */
  getServices<N extends string = never>(network?: N): ResolveServices<TDefault, TNetworks, N> {
    const overrides = network ? (this.networkOverrides[network] ?? {}) : {}
    return { ...this.defaultServices, ...overrides } as ResolveServices<TDefault, TNetworks, N>
  }

  /**
   * Get default services (without network overrides).
   */
  getDefaultServices(): TDefault {
    return { ...this.defaultServices } as TDefault
  }

  /**
   * Register protobuf type descriptors for google.protobuf.Any serialization.
   * Accepts the same inputs as `createRegistry()`: DescFile, DescMessage,
   * DescEnum, DescExtension, DescService, or existing Registry.
   * Invalidates cached registry.
   */
  addTypes(
    ...inputs: (Registry | DescFile | DescMessage | DescEnum | DescExtension | DescService)[]
  ): this {
    this.typeInputs.push(...inputs)
    this.cachedRegistry = null
    return this
  }

  /**
   * Get (or create) a Registry containing all registered type descriptors.
   * The result is cached until addTypes() is called again.
   */
  getRegistry(): Registry {
    if (!this.cachedRegistry) {
      this.cachedRegistry = createRegistry(...this.typeInputs)
    }
    return this.cachedRegistry
  }
}

/**
 * Create a new service registry builder.
 */
export function createServiceRegistry() {
  return new ServiceRegistryBuilder()
}
