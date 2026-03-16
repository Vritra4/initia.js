import type {
  DescService,
  DescMessage,
  DescFile,
  DescEnum,
  DescExtension,
  Registry,
} from '@bufbuild/protobuf'
import { createRegistry } from '@bufbuild/protobuf'
import type { GenService, GenServiceMethods } from '@bufbuild/protobuf/codegenv2'
import {
  msg as buildMsg,
  msgCustom,
  type FriendlyInit,
  type FriendlyCustomInit,
  type Message,
} from './msgs/types'
import { createDecode } from './msgs/decode'
import { ValidationError } from './errors'
import type { Any } from '@bufbuild/protobuf/wkt'

// ─── Core Type Utilities ───────────────────────────────────────────

type UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends (x: infer I) => void
  ? I
  : never

type BuildersFromOne<S extends GenService<GenServiceMethods>> =
  S extends GenService<infer Methods>
    ? {
        [K in keyof Methods]: Methods[K] extends { input: infer I extends DescMessage }
          ? (init: FriendlyInit<I>) => Message<I>
          : never
      }
    : never

export type TxInput = GenService<GenServiceMethods> | readonly GenService<GenServiceMethods>[]

export type MsgBuildersFromTx<S extends TxInput> =
  S extends readonly GenService<GenServiceMethods>[]
    ? UnionToIntersection<BuildersFromOne<S[number]>>
    : S extends GenService<GenServiceMethods>
      ? BuildersFromOne<S>
      : never

export interface CoreMsgMethods {
  custom<T extends DescMessage>(schema: T, init: FriendlyCustomInit<T>): Message<T>
  decode(any: Any): Message
}

export interface ModuleInput<
  Q extends DescService | undefined = DescService | undefined,
  T extends TxInput | undefined = TxInput | undefined,
> {
  query?: Q
  tx?: T
}

type Override<
  Base extends Record<string, unknown>,
  Overrides extends Record<string, unknown>,
> = Omit<Base, keyof Overrides> & Overrides

type ResolveModules<
  TDefault extends Record<string, ModuleInput>,
  TNetworks extends Record<string, Record<string, ModuleInput>>,
  N extends string,
> = N extends keyof TNetworks ? Override<TDefault, TNetworks[N]> : TDefault

export interface ChainConfig<TModules extends Record<string, ModuleInput>> {
  services: {
    [K in keyof TModules as TModules[K] extends { query: DescService } ? K : never]: NonNullable<
      TModules[K]['query']
    >
  }
  msgs: {
    [K in keyof TModules as TModules[K] extends { tx: TxInput } ? K : never]: MsgBuildersFromTx<
      NonNullable<TModules[K]['tx']>
    >
  } & CoreMsgMethods
  registry: Registry
}

// ─── Runtime Helpers ───────────────────────────────────────────────

interface MethodDescriptor {
  input: DescMessage
}

function getMethodEntries(svc: GenService<GenServiceMethods>): [string, MethodDescriptor][] {
  if (!svc.method || typeof svc.method !== 'object') {
    throw new ValidationError(
      'tx',
      `Expected a GenService with a .method record, got: ${
        svc == null ? String(svc) : `object with keys [${Object.keys(svc as object).join(', ')}]`
      }`
    )
  }
  return Object.entries(svc.method as Record<string, MethodDescriptor>)
}

function extractSchemas(tx: TxInput): DescMessage[] {
  const services = Array.isArray(tx) ? tx : [tx]
  const schemas: DescMessage[] = []
  for (const svc of services) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    for (const [, method] of getMethodEntries(svc)) {
      schemas.push(method.input)
    }
  }
  return schemas
}

function createMsgBuilders(
  tx: TxInput
): Record<string, (init: FriendlyInit<DescMessage>) => Message> {
  const services = Array.isArray(tx) ? tx : [tx]
  const builders: Record<string, (init: FriendlyInit<DescMessage>) => Message> = {}
  for (const svc of services) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    for (const [name, method] of getMethodEntries(svc)) {
      // Duplicate method names across multi-source tx services are expected
      // (e.g., ibcCore merges Channel + Client + Connection, all have updateParams).
      // Last service wins silently — this is intentional override semantics.
      builders[name] = init => buildMsg(method.input, init)
    }
  }
  return builders
}

// ─── ChainConfigBuilder ───────────────────────────────────────────

type TypeInput = Registry | DescFile | DescMessage | DescEnum | DescExtension | DescService

export class ChainConfigBuilder<
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  TDefault extends Record<string, ModuleInput> = {},
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  TNetworks extends Record<string, Record<string, ModuleInput>> = {},
> {
  private modules: Record<string, ModuleInput> = {}
  private networkOverrides: Record<string, Record<string, ModuleInput>> = {}
  private typeInputs: TypeInput[] = []

  addModule<K extends string, Q extends DescService, T extends TxInput>(
    name: K,
    input: { query: Q; tx: T }
  ): ChainConfigBuilder<TDefault & Record<K, { query: Q; tx: T }>, TNetworks>
  addModule<K extends string, Q extends DescService>(
    name: K,
    input: { query: Q }
  ): ChainConfigBuilder<TDefault & Record<K, { query: Q }>, TNetworks>
  addModule<K extends string, T extends TxInput>(
    name: K,
    input: { tx: T }
  ): ChainConfigBuilder<TDefault & Record<K, { tx: T }>, TNetworks>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addModule(name: string, input: ModuleInput): ChainConfigBuilder<any, any> {
    if (!input.query && !input.tx) {
      throw new ValidationError(name, 'at least one of query or tx must be provided')
    }
    const next = this.clone()
    next.modules[name] = input
    if (input.tx) {
      const schemas = extractSchemas(input.tx)
      next.typeInputs.push(...schemas)
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return next as any
  }

  forNetwork<N extends string>(network: N) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this

    type ExistingOverrides = N extends keyof TNetworks ? TNetworks[N] : Record<string, never>

    type NetworkBuilder = {
      addModule<K extends string, Q extends DescService, T extends TxInput>(
        name: K,
        input: { query: Q; tx: T }
      ): ChainConfigBuilder<
        TDefault,
        Omit<TNetworks, N> & Record<N, ExistingOverrides & Record<K, { query: Q; tx: T }>>
      >
      addModule<K extends string, Q extends DescService>(
        name: K,
        input: { query: Q }
      ): ChainConfigBuilder<
        TDefault,
        Omit<TNetworks, N> & Record<N, ExistingOverrides & Record<K, { query: Q }>>
      >
      addModule<K extends string, T extends TxInput>(
        name: K,
        input: { tx: T }
      ): ChainConfigBuilder<
        TDefault,
        Omit<TNetworks, N> & Record<N, ExistingOverrides & Record<K, { tx: T }>>
      >
    }

    const networkBuilder: NetworkBuilder = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      addModule(name: string, input: ModuleInput): ChainConfigBuilder<any, any> {
        if (!input.query && !input.tx) {
          throw new ValidationError(
            name,
            `forNetwork("${network}"): at least one of query or tx must be provided`
          )
        }
        const next = self.clone()
        if (!next.networkOverrides[network]) {
          next.networkOverrides[network] = {}
        }
        next.networkOverrides[network][name] = input
        if (input.tx) {
          const schemas = extractSchemas(input.tx)
          next.typeInputs.push(...schemas)
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return next as any
      },
    } as unknown as NetworkBuilder

    return networkBuilder
  }

  addTypes(...inputs: TypeInput[]): ChainConfigBuilder<TDefault, TNetworks> {
    const next = this.clone()
    next.typeInputs.push(...inputs)
    return next
  }

  build(): ChainConfig<TDefault>
  build<N extends string>(network: N): ChainConfig<ResolveModules<TDefault, TNetworks, N>>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  build(network?: string): ChainConfig<any> {
    const overrides = network ? (this.networkOverrides[network] ?? {}) : {}
    const resolved = { ...this.modules, ...overrides }

    // Build services map
    const services: Record<string, DescService> = {}
    for (const [name, mod] of Object.entries(resolved)) {
      if (mod.query) services[name] = mod.query
    }

    // Build msg builders from resolved modules (default + selected network overrides)
    const msgBuilders: Record<
      string,
      Record<string, (init: FriendlyInit<DescMessage>) => Message>
    > = {}
    for (const [name, mod] of Object.entries(resolved)) {
      if (mod.tx) {
        msgBuilders[name] = createMsgBuilders(mod.tx)
      }
    }

    // Collect schemas from ALL modules (default + all network overrides) for decode completeness.
    // This ensures cross-network decode works (e.g., testnet can decode mainnet gov v1 msgs).
    // Duplicates are harmless: createDecode uses a Map where last-write-wins.
    const allSchemas: DescMessage[] = []
    for (const mod of Object.values(this.modules)) {
      if (mod.tx) allSchemas.push(...extractSchemas(mod.tx))
    }
    for (const overrideMap of Object.values(this.networkOverrides)) {
      for (const mod of Object.values(overrideMap)) {
        if (mod.tx) allSchemas.push(...extractSchemas(mod.tx))
      }
    }

    // decode: resolves Any by typeUrl using schemas from all modules/networks
    // registry: resolves types from typeInputs (accumulated via addModule + addTypes),
    //           additionally contains non-module types from addTypes() (e.g., crypto keys, auth)
    const decode = createDecode(allSchemas)
    const registry = createRegistry(...this.typeInputs)

    const msgs = {
      ...msgBuilders,
      custom: msgCustom,
      decode,
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
    return { services, msgs, registry } as any
  }

  private clone(): ChainConfigBuilder<TDefault, TNetworks> {
    const next = new ChainConfigBuilder<TDefault, TNetworks>()
    next.modules = { ...this.modules }
    next.networkOverrides = Object.fromEntries(
      Object.entries(this.networkOverrides).map(([k, v]) => [k, { ...v }])
    )
    next.typeInputs = [...this.typeInputs]
    return next
  }
}

export function createChainConfig(): ChainConfigBuilder {
  return new ChainConfigBuilder()
}
