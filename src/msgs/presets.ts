/**
 * Preset module overrides for common configurations.
 *
 * @example
 * ```typescript
 * import { createMsgs, testnetModules } from 'initia.js/msgs'
 * const msgs = createMsgs('initia', { modules: testnetModules })
 * msgs.gov.submitProposal(...)  // GovLegacyModule (v1beta1)
 * ```
 */

import { defineModule } from './module-helpers'
import { govLegacyModule, govLegacySchemas } from './modules/gov-legacy'

export const testnetModules = {
  gov: defineModule({ schemas: govLegacySchemas, builders: govLegacyModule }),
} as const
