/**
 * Unit tests for base message builders.
 */

import { describe, it, expect } from 'vitest'
import { baseMsgs } from '../../../src/msgs/base'
import { coin } from '../../../src/core/coin'
import { Message } from '../../../src/msgs/types'
import { MsgSendSchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/bank/v1beta1/tx_pb'

describe('baseMsgs', () => {
  describe('send', () => {
    it('should create a MsgSend with single coin', () => {
      const msg = baseMsgs.send('init1sender...', 'init1receiver...', coin('uinit', '1000000'))

      expect(msg.toAny().typeUrl).toBe(`/cosmos.bank.v1beta1.MsgSend`)
      expect(msg.value).toBeDefined()
    })

    it('should create a MsgSend with multiple coins', () => {
      const msg = baseMsgs.send('init1sender...', 'init1receiver...', [
        coin('uinit', '1000000'),
        coin('uusdc', '500000'),
      ])

      expect(msg.toAny().typeUrl).toBe(`/cosmos.bank.v1beta1.MsgSend`)
    })

    it('should return a Message instance', () => {
      const msg = baseMsgs.send('init1sender...', 'init1receiver...', coin('uinit', '1000000'))

      expect(msg).toBeInstanceOf(Message)
      expect(msg.value).toBeDefined()
      const any = msg.toAny()
      expect(any.typeUrl).toContain('MsgSend')
      expect(any.value).toBeInstanceOf(Uint8Array)
    })
  })

  describe('transfer', () => {
    it('should create a MsgTransfer with default options', () => {
      const msg = baseMsgs.transfer(
        'init1sender...',
        'init1receiver...',
        coin('uinit', '1000000'),
        'channel-0'
      )

      expect(msg.toAny().typeUrl).toBe(`/ibc.applications.transfer.v1.MsgTransfer`)
      expect(msg.value).toBeDefined()
    })

    it('should create a MsgTransfer with custom port', () => {
      const msg = baseMsgs.transfer(
        'init1sender...',
        'init1receiver...',
        coin('uinit', '1000000'),
        'channel-0',
        { sourcePort: 'custom-port' }
      )

      expect(msg.toAny().typeUrl).toBe(`/ibc.applications.transfer.v1.MsgTransfer`)
    })

    it('should create a MsgTransfer with timeout height', () => {
      const msg = baseMsgs.transfer(
        'init1sender...',
        'init1receiver...',
        coin('uinit', '1000000'),
        'channel-0',
        {
          timeoutHeight: {
            revisionNumber: 1n,
            revisionHeight: 100000n,
          },
        }
      )

      expect(msg.toAny().typeUrl).toBe(`/ibc.applications.transfer.v1.MsgTransfer`)
    })

    it('should create a MsgTransfer with timeout timestamp', () => {
      const futureTimestamp = BigInt(Date.now() + 60000) * 1_000_000n

      const msg = baseMsgs.transfer(
        'init1sender...',
        'init1receiver...',
        coin('uinit', '1000000'),
        'channel-0',
        { timeoutTimestamp: futureTimestamp }
      )

      expect(msg.toAny().typeUrl).toBe(`/ibc.applications.transfer.v1.MsgTransfer`)
    })

    it('should create a MsgTransfer with memo', () => {
      const msg = baseMsgs.transfer(
        'init1sender...',
        'init1receiver...',
        coin('uinit', '1000000'),
        'channel-0',
        { memo: 'test memo' }
      )

      expect(msg.toAny().typeUrl).toBe(`/ibc.applications.transfer.v1.MsgTransfer`)
    })
  })

  describe('send (object syntax)', () => {
    it('should produce identical result to positional syntax', () => {
      const positional = baseMsgs.send('init1from...', 'init1to...', coin('uinit', '1000'))
      const object = baseMsgs.send({
        from: 'init1from...',
        to: 'init1to...',
        amount: coin('uinit', '1000'),
      })

      expect(object.toAny().typeUrl).toBe(positional.toAny().typeUrl)
      expect(object.toAny().value).toEqual(positional.toAny().value)
    })
  })

  describe('transfer (object syntax)', () => {
    it('should produce identical result to positional syntax', () => {
      const timeout = 1_000_000_000_000_000_000n
      const positional = baseMsgs.transfer(
        'init1s...',
        'init1r...',
        coin('uinit', '1000'),
        'channel-0',
        { timeoutTimestamp: timeout }
      )
      const object = baseMsgs.transfer({
        sender: 'init1s...',
        receiver: 'init1r...',
        token: coin('uinit', '1000'),
        channel: 'channel-0',
        timeoutTimestamp: timeout,
      })

      expect(object.toAny().typeUrl).toBe(positional.toAny().typeUrl)
      expect(object.toAny().value).toEqual(positional.toAny().value)
    })
  })

  describe('custom', () => {
    it('should create a custom message from schema', () => {
      const msg = baseMsgs.custom(MsgSendSchema, {
        fromAddress: 'init1sender...',
        toAddress: 'init1receiver...',
        amount: [{ denom: 'uinit', amount: '1000000' }],
      })

      expect(msg.toAny().typeUrl).toBe(`/cosmos.bank.v1beta1.MsgSend`)
      expect(msg.value).toBeDefined()
    })

    it('should return a Message with correct structure', () => {
      const msg = baseMsgs.custom(MsgSendSchema, {
        fromAddress: 'init1sender...',
        toAddress: 'init1receiver...',
        amount: [],
      })

      expect(msg).toBeInstanceOf(Message)
      expect(msg.value).toBeDefined()
      const any = msg.toAny()
      expect(typeof any.typeUrl).toBe('string')
      expect(any.value).toBeInstanceOf(Uint8Array)
    })
  })
})
