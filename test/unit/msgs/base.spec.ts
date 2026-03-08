/**
 * Unit tests for base message builders (namespaced module API).
 */

import { describe, it, expect } from 'vitest'
import { baseMsgs } from '../../../src/msgs/base'
import { coin } from '../../../src/core/coin'
import { Message } from '../../../src/msgs/types'
import { MsgSendSchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/bank/v1beta1/tx_pb'

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
    it('should create a MsgTransfer with defaults', () => {
      const msg = baseMsgs.ibc.transfer({
        sender: 'init1sender...',
        receiver: 'init1receiver...',
        token: coin('uinit', '1000000'),
        sourceChannel: 'channel-0',
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
        timeoutHeight: {
          revisionNumber: 1n,
          revisionHeight: 100000n,
        },
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
        timeoutTimestamp: futureTimestamp,
      })

      expect(msg.toAny().typeUrl).toBe('/ibc.applications.transfer.v1.MsgTransfer')
    })

    it('should create a MsgTransfer with memo', () => {
      const msg = baseMsgs.ibc.transfer({
        sender: 'init1sender...',
        receiver: 'init1receiver...',
        token: coin('uinit', '1000000'),
        sourceChannel: 'channel-0',
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
