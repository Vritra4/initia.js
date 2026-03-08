/**
 * T2: Unit tests for createMsgs factory.
 */

import { describe, it, expect } from 'vitest'
import { createMsgs } from '../../../src/msgs'
import { Message } from '../../../src/msgs/types'
import { coin } from '../../../src/core/coin'
import { defineModule } from '../../../src/msgs/module-helpers'
import { govLegacyModule, govLegacySchemas } from '../../../src/msgs/modules/gov-legacy'
import { InitiaError, ValidationError } from '../../../src/errors'

describe('createMsgs', () => {
  describe('chain type selection', () => {
    it('should create baseMsgs for unknown chain type', () => {
      const msgs = createMsgs('other')
      expect(msgs.bank).toBeDefined()
      expect(msgs.ibc).toBeDefined()
      expect(msgs.custom).toBeTypeOf('function')
      expect(msgs.decode).toBeTypeOf('function')
    })

    it('should create initiaMsgs for "initia"', () => {
      const msgs = createMsgs('initia')
      expect(msgs.bank).toBeDefined()
      expect(msgs.gov).toBeDefined()
      expect(msgs.move).toBeDefined()
      expect(msgs.mstaking).toBeDefined()
      expect(msgs.ophost).toBeDefined()
    })

    it('should create minimoveMsgs for "minimove"', () => {
      const msgs = createMsgs('minimove')
      expect(msgs.bank).toBeDefined()
      expect(msgs.move).toBeDefined()
    })

    it('should create miniwasmMsgs for "miniwasm"', () => {
      const msgs = createMsgs('miniwasm')
      expect(msgs.bank).toBeDefined()
      expect(msgs.wasm).toBeDefined()
    })

    it('should create minievmMsgs for "minievm"', () => {
      const msgs = createMsgs('minievm')
      expect(msgs.bank).toBeDefined()
      expect(msgs.evm).toBeDefined()
    })

    it('should throw InitiaError for unknown chain type', () => {
      expect(() => createMsgs('invalid' as never)).toThrow(InitiaError)
      expect(() => createMsgs('invalid' as never)).toThrow('Unknown chain type')
    })
  })

  describe('module injection', () => {
    it('should override gov module with custom module', () => {
      const msgs = createMsgs('initia', {
        modules: {
          gov: defineModule({ schemas: govLegacySchemas, builders: govLegacyModule }),
        },
      })

      expect(msgs.gov).toBe(govLegacyModule)
      expect(msgs.bank).toBeDefined()
    })

    it('should still have working decode after module injection', () => {
      const msgs = createMsgs('initia', {
        modules: {
          gov: defineModule({ schemas: govLegacySchemas, builders: govLegacyModule }),
        },
      })

      const msg = msgs.bank.send({
        fromAddress: 'init1a',
        toAddress: 'init1b',
        amount: coin('uinit', '100'),
      })

      const decoded = msgs.decode(msg.toAny())
      expect(decoded).toBeInstanceOf(Message)
    })

    it('should decode messages from injected module schemas', () => {
      const msgs = createMsgs('initia', {
        modules: {
          gov: defineModule({ schemas: govLegacySchemas, builders: govLegacyModule }),
        },
      })

      const govMsg = msgs.gov.vote({
        proposalId: 1n,
        voter: 'init1voter',
        option: 1,
      } as never)

      const decoded = msgs.decode(govMsg.toAny())
      expect(decoded).toBeInstanceOf(Message)
      expect(decoded.typeUrl).toBe(govMsg.typeUrl)
    })

    it('should return base msgs when modules is empty', () => {
      const msgs = createMsgs('initia', { modules: {} })
      expect(msgs.gov).toBeDefined()
    })

    it('should throw when injecting reserved module name "decode"', () => {
      expect(() =>
        createMsgs('initia', {
          modules: {
            decode: defineModule({ schemas: govLegacySchemas, builders: govLegacyModule }),
          },
        } as never)
      ).toThrow(InitiaError)
      expect(() =>
        createMsgs('initia', {
          modules: {
            decode: defineModule({ schemas: govLegacySchemas, builders: govLegacyModule }),
          },
        } as never)
      ).toThrow('reserved')
    })

    it('should throw when injecting reserved module name "custom"', () => {
      expect(() =>
        createMsgs('initia', {
          modules: {
            custom: defineModule({ schemas: govLegacySchemas, builders: govLegacyModule }),
          },
        } as never)
      ).toThrow(InitiaError)
      expect(() =>
        createMsgs('initia', {
          modules: {
            custom: defineModule({ schemas: govLegacySchemas, builders: govLegacyModule }),
          },
        } as never)
      ).toThrow('reserved')
    })

    it('should throw ValidationError for malformed module definition', () => {
      expect(() =>
        createMsgs('initia', {
          modules: {
            bad: { schemas: 'not-array', builders: {} } as never,
          },
        })
      ).toThrow(ValidationError)
      expect(() =>
        createMsgs('initia', {
          modules: {
            bad: { schemas: 'not-array', builders: {} } as never,
          },
        })
      ).toThrow('must have an array')
    })

    it('should throw when injecting reserved module name "_schemas"', () => {
      expect(() =>
        createMsgs('initia', {
          modules: {
            _schemas: defineModule({ schemas: govLegacySchemas, builders: govLegacyModule }),
          },
        } as never)
      ).toThrow(InitiaError)
      expect(() =>
        createMsgs('initia', {
          modules: {
            _schemas: defineModule({ schemas: govLegacySchemas, builders: govLegacyModule }),
          },
        } as never)
      ).toThrow('reserved')
    })
  })

  describe('message building', () => {
    it('should produce valid Message instances from all chain types', () => {
      for (const chainType of ['initia', 'minimove', 'miniwasm', 'minievm', 'other'] as const) {
        const msgs = createMsgs(chainType)
        const msg = msgs.bank.send({
          fromAddress: 'init1sender',
          toAddress: 'init1receiver',
          amount: coin('uinit', '1000'),
        })
        expect(msg).toBeInstanceOf(Message)
        expect(msg.toAny().typeUrl).toBe('/cosmos.bank.v1beta1.MsgSend')
      }
    })
  })

  describe('chain-specific decode round-trip', () => {
    it('should decode MsgSend on all chain types', () => {
      for (const chainType of ['initia', 'minimove', 'miniwasm', 'minievm', 'other'] as const) {
        const msgs = createMsgs(chainType)
        const msg = msgs.bank.send({
          fromAddress: 'init1a',
          toAddress: 'init1b',
          amount: coin('uinit', '100'),
        })
        const decoded = msgs.decode(msg.toAny())
        expect(decoded).toBeInstanceOf(Message)
        expect(decoded.typeUrl).toBe('/cosmos.bank.v1beta1.MsgSend')
      }
    })

    it('should decode VM-specific messages for minimove', () => {
      const msgs = createMsgs('minimove')
      const msg = msgs.move.execute({
        sender: 'init1a',
        moduleAddress: 'init1b',
        moduleName: 'module',
        functionName: 'func',
        typeArgs: [],
        args: [],
      })
      const decoded = msgs.decode(msg.toAny())
      expect(decoded.typeUrl).toBe('/initia.move.v1.MsgExecute')
    })

    it('should decode VM-specific messages for minievm', () => {
      const msgs = createMsgs('minievm')
      const msg = msgs.evm.call({
        sender: 'init1a',
        contractAddr: '0xcontract',
        input: '0x00',
      })
      const decoded = msgs.decode(msg.toAny())
      expect(decoded.typeUrl).toBe('/minievm.evm.v1.MsgCall')
    })

    it('should decode VM-specific messages for miniwasm', () => {
      const msgs = createMsgs('miniwasm')
      const msg = msgs.wasm.executeContract({
        sender: 'init1a',
        contract: 'init1contract',
        msg: new TextEncoder().encode('{}'),
      })
      const decoded = msgs.decode(msg.toAny())
      expect(decoded.typeUrl).toBe('/cosmwasm.wasm.v1.MsgExecuteContract')
    })
  })
})
