/**
 * Unit tests for Minievm rollup message builders.
 */

import { describe, it, expect } from 'vitest'
import { minievmMsgs } from '../../../src/msgs/minievm'
import { coin } from '../../../src/core/coin'
import { Message } from '../../../src/msgs/types'

describe('minievmMsgs', () => {
  // ============= EVM =============

  describe('create', () => {
    it('should create a MsgCreate for contract deployment', () => {
      const code = new Uint8Array([0x60, 0x80, 0x60, 0x40]) // Sample EVM bytecode
      const msg = minievmMsgs.create('init1sender...', code)

      expect(msg.toAny().typeUrl).toBe(`/minievm.evm.v1.MsgCreate`)
      expect(msg.value).toBeDefined()
    })

    it('should create a MsgCreate with value', () => {
      const code = new Uint8Array([0x60, 0x80, 0x60, 0x40, 0x52])
      const msg = minievmMsgs.create(
        'init1sender...',
        code,
        '1000000000000000000' // 1 ETH in wei
      )

      expect(msg.toAny().typeUrl).toBe(`/minievm.evm.v1.MsgCreate`)
      expect(msg).toBeInstanceOf(Message)
    })

    it('should create a MsgCreate with zero value', () => {
      const code = new Uint8Array([0xff])
      const msg = minievmMsgs.create('init1sender...', code, '0')

      expect(msg.toAny().typeUrl).toBe(`/minievm.evm.v1.MsgCreate`)
    })
  })

  describe('call', () => {
    it('should create a MsgCall for contract interaction', () => {
      // Sample ABI-encoded call data (transfer function selector)
      const input = new Uint8Array([0xa9, 0x05, 0x9c, 0xbb])
      const msg = minievmMsgs.call(
        'init1sender...',
        '0x1234567890abcdef1234567890abcdef12345678',
        input
      )

      expect(msg.toAny().typeUrl).toBe(`/minievm.evm.v1.MsgCall`)
      expect(msg.value).toBeDefined()
    })

    it('should create a MsgCall with value', () => {
      const input = new Uint8Array([0x00]) // Empty call data
      const msg = minievmMsgs.call(
        'init1sender...',
        '0xcontract...',
        input,
        '500000000000000000' // 0.5 ETH in wei
      )

      expect(msg.toAny().typeUrl).toBe(`/minievm.evm.v1.MsgCall`)
      expect(msg).toBeInstanceOf(Message)
    })

    it('should create a MsgCall with complex input data', () => {
      // Simulated ABI-encoded function call with parameters
      const input = new Uint8Array([
        0xa9,
        0x05,
        0x9c,
        0xbb, // function selector
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00, // padding
        0x00,
        0x00,
        0x00,
        0x00,
        0x12,
        0x34,
        0x56,
        0x78, // address part
      ])
      const msg = minievmMsgs.call('init1sender...', '0xcontract...', input)

      expect(msg.toAny().typeUrl).toBe(`/minievm.evm.v1.MsgCall`)
    })
  })

  // ============= Inherited from BaseMsgs =============

  describe('inherited send', () => {
    it('should have send method from baseMsgs', () => {
      const msg = minievmMsgs.send('init1from...', 'init1to...', coin('umin', '1000000'))

      expect(msg.toAny().typeUrl).toBe(`/cosmos.bank.v1beta1.MsgSend`)
    })
  })

  describe('inherited transfer', () => {
    it('should have transfer method from baseMsgs', () => {
      const msg = minievmMsgs.transfer(
        'init1sender...',
        'init1receiver...',
        coin('umin', '1000000'),
        'channel-0'
      )

      expect(msg.toAny().typeUrl).toBe(`/ibc.applications.transfer.v1.MsgTransfer`)
    })
  })
})
