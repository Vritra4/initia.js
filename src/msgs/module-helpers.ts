import type { DescMessage } from '@bufbuild/protobuf'
import { ValidationError } from '../errors'

/**
 * Pairs a module's proto schemas with its builder functions.
 *
 * `schemas` must include all proto schemas used by `builders` —
 * otherwise those message types will not be decodable via `decode()`.
 * This correspondence is not enforced at the type level; ensure
 * schemas and builders stay in sync when modifying modules.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ModuleDefinition<B extends object = any> {
  schemas: DescMessage[]
  builders: B
}

/**
 * Type-safe wrapper for defining a module with its schemas and builders.
 * Exists for type inference — pass the result to createMsgs() options.modules.
 *
 * @example
 * ```typescript
 * const myModule = defineModule({ schemas: [...], builders: { send: init => msg(...) } })
 * const msgs = createMsgs('other', { modules: { myMod: myModule } })
 * ```
 */
export function defineModule<B extends object>(def: ModuleDefinition<B>): ModuleDefinition<B> {
  if (!Array.isArray(def.schemas)) {
    throw new ValidationError(
      'schemas',
      'ModuleDefinition.schemas must be an array of DescMessage descriptors.'
    )
  }
  if (def.schemas.length === 0 && Object.keys(def.builders).length > 0) {
    throw new ValidationError(
      'schemas',
      'ModuleDefinition has builders but no schemas. Messages built by this module will not be decodable via decode(). ' +
        'Add the proto schema descriptors to the schemas array.'
    )
  }
  return def
}
