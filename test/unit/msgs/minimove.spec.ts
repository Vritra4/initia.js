/**
 * Unit tests for Minimove rollup message builders.
 */

import { describe, it, expect } from 'vitest'
import { minimoveMsgs } from '../../../src/msgs/minimove'
import { coin } from '../../../src/core/coin'
import { Message } from '../../../src/msgs/types'

describe('minimoveMsgs', () => {
  // ============= Move =============

  describe('execute', () => {
    it('should create a MsgExecute for Move function', () => {
      const msg = minimoveMsgs.execute(
        'init1sender...',
        'init1module...',
        'my_module',
        'my_function',
        ['0x1::string::String'],
        [new Uint8Array([1, 2, 3])]
      )

      expect(msg.toAny().typeUrl).toBe(`/initia.move.v1.MsgExecute`)
      expect(msg.value).toBeDefined()
    })

    it('should create a MsgExecute with empty args', () => {
      const msg = minimoveMsgs.execute(
        'init1sender...',
        'init1module...',
        'my_module',
        'my_function',
        [],
        []
      )

      expect(msg.toAny().typeUrl).toBe(`/initia.move.v1.MsgExecute`)
    })

    it('should create a MsgExecute with multiple type args', () => {
      const msg = minimoveMsgs.execute(
        'init1sender...',
        'init1module...',
        'swap_module',
        'swap',
        ['0x1::coin::Coin<0x1::native::INIT>', '0x1::coin::Coin<0x1::native::USDC>'],
        [new Uint8Array([100, 0, 0, 0])]
      )

      expect(msg.toAny().typeUrl).toBe(`/initia.move.v1.MsgExecute`)
      expect(msg).toBeInstanceOf(Message)
    })
  })

  describe('script', () => {
    it('should create a MsgScript', () => {
      const codeBytes = new Uint8Array([0x00, 0x01, 0x02, 0x03])
      const msg = minimoveMsgs.script('init1sender...', codeBytes, [], [])

      expect(msg.toAny().typeUrl).toBe(`/initia.move.v1.MsgScript`)
      expect(msg.value).toBeDefined()
    })

    it('should create a MsgScript with type args and args', () => {
      const codeBytes = new Uint8Array([0xa1, 0xb2, 0xc3, 0xd4])
      const msg = minimoveMsgs.script(
        'init1sender...',
        codeBytes,
        ['0x1::string::String'],
        [new Uint8Array([10, 20, 30])]
      )

      expect(msg.toAny().typeUrl).toBe(`/initia.move.v1.MsgScript`)
      expect(msg).toBeInstanceOf(Message)
    })
  })

  // ============= Inherited from BaseMsgs =============

  describe('inherited send', () => {
    it('should have send method from baseMsgs', () => {
      const msg = minimoveMsgs.send('init1from...', 'init1to...', coin('umin', '1000000'))

      expect(msg.toAny().typeUrl).toBe(`/cosmos.bank.v1beta1.MsgSend`)
    })
  })

  describe('inherited transfer', () => {
    it('should have transfer method from baseMsgs', () => {
      const msg = minimoveMsgs.transfer(
        'init1sender...',
        'init1receiver...',
        coin('umin', '1000000'),
        'channel-0'
      )

      expect(msg.toAny().typeUrl).toBe(`/ibc.applications.transfer.v1.MsgTransfer`)
    })
  })
})
