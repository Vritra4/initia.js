/**
 * Unit tests for Minimove rollup message builders (ChainConfigBuilder API).
 */

import { describe, it, expect } from 'vitest'
import { minimoveChain } from '../../../src/chains/minimove'
import { coin } from '../../../src/core/coin'
import { Message } from '../../../src/msgs/types'

const minimoveMsgs = minimoveChain.build().msgs

describe('minimoveMsgs', () => {
  describe('move.execute', () => {
    it('should create a MsgExecute for Move function', () => {
      const msg = minimoveMsgs.move.execute({
        sender: 'init1sender...',
        moduleAddress: 'init1module...',
        moduleName: 'my_module',
        functionName: 'my_function',
        typeArgs: ['0x1::string::String'],
        args: [new Uint8Array([1, 2, 3])],
      })

      expect(msg.toAny().typeUrl).toBe('/initia.move.v1.MsgExecute')
      expect(msg.value).toBeDefined()
    })

    it('should create a MsgExecute with empty args', () => {
      const msg = minimoveMsgs.move.execute({
        sender: 'init1sender...',
        moduleAddress: 'init1module...',
        moduleName: 'my_module',
        functionName: 'my_function',
        typeArgs: [],
        args: [],
      })

      expect(msg.toAny().typeUrl).toBe('/initia.move.v1.MsgExecute')
    })

    it('should create a MsgExecute with multiple type args', () => {
      const msg = minimoveMsgs.move.execute({
        sender: 'init1sender...',
        moduleAddress: 'init1module...',
        moduleName: 'swap_module',
        functionName: 'swap',
        typeArgs: ['0x1::coin::Coin<0x1::native::INIT>', '0x1::coin::Coin<0x1::native::USDC>'],
        args: [new Uint8Array([100, 0, 0, 0])],
      })

      expect(msg.toAny().typeUrl).toBe('/initia.move.v1.MsgExecute')
      expect(msg).toBeInstanceOf(Message)
    })
  })

  describe('move.script', () => {
    it('should create a MsgScript', () => {
      const codeBytes = new Uint8Array([0x00, 0x01, 0x02, 0x03])
      const msg = minimoveMsgs.move.script({
        sender: 'init1sender...',
        codeBytes,
        typeArgs: [],
        args: [],
      })

      expect(msg.toAny().typeUrl).toBe('/initia.move.v1.MsgScript')
      expect(msg.value).toBeDefined()
    })

    it('should create a MsgScript with type args and args', () => {
      const codeBytes = new Uint8Array([0xa1, 0xb2, 0xc3, 0xd4])
      const msg = minimoveMsgs.move.script({
        sender: 'init1sender...',
        codeBytes,
        typeArgs: ['0x1::string::String'],
        args: [new Uint8Array([10, 20, 30])],
      })

      expect(msg.toAny().typeUrl).toBe('/initia.move.v1.MsgScript')
      expect(msg).toBeInstanceOf(Message)
    })
  })

  describe('bank.send', () => {
    it('should have send method', () => {
      const msg = minimoveMsgs.bank.send({
        fromAddress: 'init1from...',
        toAddress: 'init1to...',
        amount: coin('umin', '1000000'),
      })

      expect(msg.toAny().typeUrl).toBe('/cosmos.bank.v1beta1.MsgSend')
    })
  })

  describe('ibc.transfer', () => {
    it('should have transfer method', () => {
      const msg = minimoveMsgs.ibc.transfer({
        sender: 'init1sender...',
        receiver: 'init1receiver...',
        token: coin('umin', '1000000'),
        sourceChannel: 'channel-0',
        sourcePort: 'transfer',
        timeoutHeight: { revisionNumber: 0n, revisionHeight: 0n },
        timeoutTimestamp: BigInt(Date.now() + 10 * 60_000) * 1_000_000n,
        memo: '',
      })

      expect(msg.toAny().typeUrl).toBe('/ibc.applications.transfer.v1.MsgTransfer')
    })
  })
})
