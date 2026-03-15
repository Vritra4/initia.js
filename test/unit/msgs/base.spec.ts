/**
 * Unit tests for base message builders (common chain config API).
 */

import { describe, it, expect } from 'vitest'
import { createBaseConfig } from '../../../src/chains/common'
import { coin } from '../../../src/core/coin'
import { Message } from '../../../src/msgs/types'
import { MsgSendSchema } from '@initia/initia-proto/cosmos/bank/v1beta1/tx_pb'

const baseMsgs = createBaseConfig().build().msgs

describe('baseMsgs', () => {
  describe('bank.send', () => {
    it('should create a MsgSend', () => {
      const msg = baseMsgs.bank.send({
        fromAddress: 'init1sender...',
        toAddress: 'init1receiver...',
        amount: coin('uinit', '1000000'),
      })

      expect(msg.toAny().typeUrl).toBe('/cosmos.bank.v1beta1.MsgSend')
      expect(msg.value.fromAddress).toBe('init1sender...')
      expect(msg.value.toAddress).toBe('init1receiver...')
      expect(msg.value.amount).toHaveLength(1)
      expect(msg.value.amount[0].denom).toBe('uinit')
      expect(msg.value.amount[0].amount).toBe('1000000')
    })

    it('should return a Message instance', () => {
      const msg = baseMsgs.bank.send({
        fromAddress: 'init1sender...',
        toAddress: 'init1receiver...',
        amount: coin('uinit', '1000000'),
      })

      expect(msg).toBeInstanceOf(Message)
      const any = msg.toAny()
      expect(any.typeUrl).toContain('MsgSend')
      expect(any.value).toBeInstanceOf(Uint8Array)
    })
  })

  describe('ibc.transfer', () => {
    it('should create a MsgTransfer with all required fields', () => {
      const msg = baseMsgs.ibc.transfer({
        sender: 'init1sender...',
        receiver: 'init1receiver...',
        token: coin('uinit', '1000000'),
        sourceChannel: 'channel-0',
        sourcePort: 'transfer',
        timeoutHeight: { revisionNumber: 0n, revisionHeight: 0n },
        timeoutTimestamp: BigInt(Date.now() + 10 * 60_000) * 1_000_000n,
        memo: '',
      })

      expect(msg.toAny().typeUrl).toBe('/ibc.applications.transfer.v1.MsgTransfer')
      expect(msg.value.sender).toBe('init1sender...')
      expect(msg.value.receiver).toBe('init1receiver...')
      expect(msg.value.sourceChannel).toBe('channel-0')
      expect(msg.value.token?.denom).toBe('uinit')
      expect(msg.value.token?.amount).toBe('1000000')
      expect(msg.value.sourcePort).toBe('transfer')
    })

    it('should create a MsgTransfer with custom port', () => {
      const msg = baseMsgs.ibc.transfer({
        sender: 'init1sender...',
        receiver: 'init1receiver...',
        token: coin('uinit', '1000000'),
        sourceChannel: 'channel-0',
        sourcePort: 'custom-port',
        timeoutHeight: { revisionNumber: 0n, revisionHeight: 0n },
        timeoutTimestamp: 0n,
        memo: '',
      })

      expect(msg.toAny().typeUrl).toBe('/ibc.applications.transfer.v1.MsgTransfer')
      expect(msg.value.sourcePort).toBe('custom-port')
    })

    it('should create a MsgTransfer with timeout height', () => {
      const msg = baseMsgs.ibc.transfer({
        sender: 'init1sender...',
        receiver: 'init1receiver...',
        token: coin('uinit', '1000000'),
        sourceChannel: 'channel-0',
        sourcePort: 'transfer',
        timeoutHeight: {
          revisionNumber: 1n,
          revisionHeight: 100000n,
        },
        timeoutTimestamp: 0n,
        memo: '',
      })

      expect(msg.toAny().typeUrl).toBe('/ibc.applications.transfer.v1.MsgTransfer')
    })

    it('should create a MsgTransfer with timeout timestamp', () => {
      const futureTimestamp = BigInt(Date.now() + 60000) * 1_000_000n

      const msg = baseMsgs.ibc.transfer({
        sender: 'init1sender...',
        receiver: 'init1receiver...',
        token: coin('uinit', '1000000'),
        sourceChannel: 'channel-0',
        sourcePort: 'transfer',
        timeoutHeight: { revisionNumber: 0n, revisionHeight: 0n },
        timeoutTimestamp: futureTimestamp,
        memo: '',
      })

      expect(msg.toAny().typeUrl).toBe('/ibc.applications.transfer.v1.MsgTransfer')
    })

    it('should create a MsgTransfer with memo', () => {
      const msg = baseMsgs.ibc.transfer({
        sender: 'init1sender...',
        receiver: 'init1receiver...',
        token: coin('uinit', '1000000'),
        sourceChannel: 'channel-0',
        sourcePort: 'transfer',
        timeoutHeight: { revisionNumber: 0n, revisionHeight: 0n },
        timeoutTimestamp: 0n,
        memo: 'test memo',
      })

      expect(msg.toAny().typeUrl).toBe('/ibc.applications.transfer.v1.MsgTransfer')
    })
  })

  describe('custom', () => {
    it('should create a custom message from schema', () => {
      const msg = baseMsgs.custom(MsgSendSchema, {
        fromAddress: 'init1sender...',
        toAddress: 'init1receiver...',
        amount: coin('uinit', '1000000'),
      })

      expect(msg.toAny().typeUrl).toBe('/cosmos.bank.v1beta1.MsgSend')
      expect(msg.value.fromAddress).toBe('init1sender...')
      expect(msg.value.toAddress).toBe('init1receiver...')
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
