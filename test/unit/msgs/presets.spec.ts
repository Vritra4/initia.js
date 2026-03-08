/**
 * T4: Unit tests for testnetModules preset.
 */

import { describe, it, expect } from 'vitest'
import { testnetModules } from '../../../src/msgs/presets'
import { createMsgs } from '../../../src/msgs'
import { defineModule } from '../../../src/msgs/module-helpers'
import { govLegacyModule } from '../../../src/msgs/modules/gov-legacy'
import { ValidationError } from '../../../src/errors'

describe('testnetModules', () => {
  it('should have gov module', () => {
    expect(testnetModules.gov).toBeDefined()
    expect(testnetModules.gov.schemas).toBeDefined()
    expect(testnetModules.gov.builders).toBeDefined()
  })

  it('should use govLegacyModule as gov builders', () => {
    expect(testnetModules.gov.builders).toBe(govLegacyModule)
  })

  it('should work with createMsgs for module injection', () => {
    const msgs = createMsgs('initia', { modules: testnetModules })
    expect(msgs.gov).toBe(govLegacyModule)
    expect(msgs.bank).toBeDefined()
    expect(msgs.decode).toBeTypeOf('function')
  })
})

describe('defineModule', () => {
  it('should throw when schemas is empty but builders is non-empty', () => {
    expect(() => defineModule({ schemas: [], builders: { foo: () => {} } })).toThrow(
      ValidationError
    )
    expect(() => defineModule({ schemas: [], builders: { foo: () => {} } })).toThrow('no schemas')
  })

  it('should throw when schemas is not an array', () => {
    expect(() => defineModule({ schemas: 'not-array' as never, builders: {} })).toThrow(
      ValidationError
    )
    expect(() => defineModule({ schemas: 'not-array' as never, builders: {} })).toThrow(
      'must be an array'
    )
  })

  it('should allow empty schemas with empty builders', () => {
    const mod = defineModule({ schemas: [], builders: {} })
    expect(mod.schemas).toHaveLength(0)
  })

  it('should pass through valid module definition', () => {
    const schemas = testnetModules.gov.schemas
    const builders = testnetModules.gov.builders
    const mod = defineModule({ schemas, builders })
    expect(mod.schemas).toBe(schemas)
    expect(mod.builders).toBe(builders)
  })
})
