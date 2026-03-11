import type {
  DescMessage,
  DescField,
  MessageShape,
  JsonValue,
  JsonWriteOptions,
} from '@bufbuild/protobuf'
import { toJson } from '@bufbuild/protobuf'

const WRAPPED_MARKER = Symbol.for('initia.wrappedResponse')

// =============================================================================
// Field Map Cache (WeakMap per DescMessage — build once per schema type)
// =============================================================================

type FieldMap = Map<string, DescField>
const fieldMapCache = new WeakMap<DescMessage, FieldMap>()

function getFieldMap(schema: DescMessage): FieldMap {
  let map = fieldMapCache.get(schema)
  if (!map) {
    map = new Map()
    for (const field of schema.fields) {
      if (field.fieldKind === 'message') {
        map.set(field.localName, field)
      } else if (field.fieldKind === 'list' && field.listKind === 'message') {
        map.set(field.localName, field)
      } else if (field.fieldKind === 'map' && field.mapKind === 'message') {
        map.set(field.localName, field)
      }
    }
    fieldMapCache.set(schema, map)
  }
  return map
}

// =============================================================================
// Response Wrapper
// =============================================================================

/**
 * Wrap a gRPC response with a Proxy that adds $schema, typeUrl, and toJson()
 * while preserving depth — property access stays identical.
 *
 * - `$schema`: The DescMessage schema descriptor
 * - `typeUrl`: '/' + schema.typeName (same pattern as Message class)
 * - `toJson(options?)`: Canonical protobuf JSON serialization with optional JsonWriteOptions
 *
 * Nested message-type fields are recursively wrapped using the field's
 * DescMessage from the schema descriptor. Supported field kinds:
 * - `fieldKind: 'message'` — single nested message
 * - `fieldKind: 'list', listKind: 'message'` — repeated message
 * - `fieldKind: 'map', mapKind: 'message'` — map with message values
 *
 * Field maps are cached per schema via WeakMap for O(1) lookup after first access.
 * Assumes protobuf-es message immutability — nestedCache may return stale data
 * if underlying fields are mutated after wrapping.
 *
 * Protobuf's own `$typeName` passes through from the underlying message.
 */
export function wrapResponse<T extends object>(schema: DescMessage, value: T): T & WrappedResponse {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
  if (value == null || typeof value !== 'object') return value as any

  // Don't double-wrap
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
  if (WRAPPED_MARKER in value) return value as any

  const fieldMap = getFieldMap(schema)
  const nestedCache = new Map<string, unknown>()

  const proxy = new Proxy(value, {
    get(target, prop, receiver) {
      if (prop === WRAPPED_MARKER) return true
      if (prop === '$schema') return schema
      if (prop === 'typeUrl' && !Reflect.has(target, prop)) return '/' + schema.typeName
      if (prop === 'toJson') {
        return (options?: Partial<JsonWriteOptions>) =>
          toJson(schema, target as MessageShape<typeof schema>, options)
      }

      const raw = Reflect.get(target, prop, receiver)

      // Recursively wrap message-type fields
      if (typeof prop === 'string' && fieldMap.has(prop) && raw != null) {
        if (nestedCache.has(prop)) return nestedCache.get(prop)

        const field = fieldMap.get(prop)!
        let wrapped: unknown

        if (field.fieldKind === 'message') {
          wrapped = wrapResponse(field.message, raw as object)
        } else if (field.fieldKind === 'list' && field.listKind === 'message') {
          const arr = raw as object[]
          wrapped = arr.map(item => wrapResponse(field.message, item))
        } else if (field.fieldKind === 'map' && field.mapKind === 'message') {
          const entries = Object.entries(raw as Record<string, object>)
          wrapped = Object.fromEntries(entries.map(([k, v]) => [k, wrapResponse(field.message, v)]))
        }

        if (wrapped !== undefined) {
          nestedCache.set(prop, wrapped)
          return wrapped
        }
      }

      return raw
    },

    has(target, prop) {
      if (prop === WRAPPED_MARKER || prop === '$schema' || prop === 'toJson') return true
      if (prop === 'typeUrl') return true // either from target or computed
      return Reflect.has(target, prop)
    },

    // Only include target's own keys — synthetic properties ($schema, typeUrl, toJson)
    // are accessible via `in` operator and direct access, but don't appear in
    // Object.keys(), for...in, spread, or JSON.stringify
    ownKeys(target) {
      return Reflect.ownKeys(target)
    },

    getOwnPropertyDescriptor(target, prop) {
      return Reflect.getOwnPropertyDescriptor(target, prop)
    },
  })
  return proxy as T & WrappedResponse
}

// =============================================================================
// Type Guard & Types
// =============================================================================

/**
 * Type guard: check if a value is a wrapped gRPC response.
 * Generic preserves the input type through narrowing:
 *   isWrappedResponse(coin) → coin is Coin & WrappedResponse
 */
export function isWrappedResponse<T>(value: T): value is T & WrappedResponse {
  return value != null && typeof value === 'object' && WRAPPED_MARKER in (value as object)
}

/** A gRPC response enhanced with schema access and JSON serialization. */
export type WrappedResponse<T = unknown> = T & {
  /** The protobuf schema descriptor for this response */
  readonly $schema: DescMessage
  /** Type URL with '/' prefix (e.g., '/cosmos.bank.v1beta1.QueryBalanceResponse') */
  readonly typeUrl: string
  /** Serialize to JSON using protobuf's canonical JSON mapping */
  toJson(options?: Partial<JsonWriteOptions>): JsonValue
}

/**
 * Transforms Promise return types to include WrappedResponse.
 * Non-Promise types (e.g., AsyncIterable for streaming) pass through unchanged.
 */
export type WrapReturnType<T> = T extends Promise<infer O> ? Promise<WrappedResponse<O>> : T
