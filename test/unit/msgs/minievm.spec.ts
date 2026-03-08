/**
 * Unit tests for Minievm rollup message builders (namespaced module API).
 */

import { describe, it, expect } from 'vitest'
import { minievmMsgs } from '../../../src/msgs/minievm'
import { coin } from '../../../src/core/coin'
import { Message } from '../../../src/msgs/types'

describe('minievmMsgs', () => {
  // ============= EVM =============

  describe('evm.create', () => {
    it('should create a MsgCreate for contract deployment', () => {
      const msg = minievmMsgs.evm.create({
        sender: 'init1sender...',
        code: '0x60806040',
      })

      expect(msg.toAny().typeUrl).toBe('/minievm.evm.v1.MsgCreate')
      expect(msg.value).toBeDefined()
    })

    it('should create a MsgCreate without explicit value', () => {
      const msg = minievmMsgs.evm.create({
        sender: 'init1sender...',
        code: '0x6080604052',
      })

      expect(msg.toAny().typeUrl).toBe('/minievm.evm.v1.MsgCreate')
      expect(msg).toBeInstanceOf(Message)
    })
  })

  describe('evm.call', () => {
    it('should create a MsgCall for contract interaction', () => {
      const msg = minievmMsgs.evm.call({
        sender: 'init1sender...',
        contractAddr: '0x1234567890abcdef1234567890abcdef12345678',
        input: '0xa9059cbb',
      })

      expect(msg.toAny().typeUrl).toBe('/minievm.evm.v1.MsgCall')
      expect(msg.value).toBeDefined()
    })

    it('should default value to "0" when omitted', () => {
      const msg = minievmMsgs.evm.call({
        sender: 'init1sender...',
        contractAddr: '0xcontract...',
        input: '0x00',
      })

      expect(msg.value.value).toBe('0')
    })

    it('should override default value when explicitly provided', () => {
      const msg = minievmMsgs.evm.call({
        sender: 'init1sender...',
        contractAddr: '0xcontract...',
        input: '0x00',
        value: '100',
      })

      expect(msg.value.value).toBe('100')
    })
  })

  // ============= OpChild =============

  describe('opchild.initiateTokenWithdrawal', () => {
    it('should create a MsgInitiateTokenWithdrawal', () => {
      const msg = minievmMsgs.opchild.initiateTokenWithdrawal({
        sender: 'init1sender...',
        to: 'init1receiver...',
        amount: coin('umin', '1000000'),
      })

      expect(msg.toAny().typeUrl).toBe('/opinit.opchild.v1.MsgInitiateTokenWithdrawal')
      expect(msg.value.sender).toBe('init1sender...')
    })
  })

  // ============= Inherited Bank / IBC =============

  describe('bank.send', () => {
    it('should have send method', () => {
      const msg = minievmMsgs.bank.send({
        fromAddress: 'init1from...',
        toAddress: 'init1to...',
        amount: coin('umin', '1000000'),
      })

      expect(msg.toAny().typeUrl).toBe('/cosmos.bank.v1beta1.MsgSend')
    })
  })

  describe('ibc.transfer', () => {
    it('should have transfer method', () => {
      const msg = minievmMsgs.ibc.transfer({
        sender: 'init1sender...',
        receiver: 'init1receiver...',
        token: coin('umin', '1000000'),
        sourceChannel: 'channel-0',
      })

      expect(msg.toAny().typeUrl).toBe('/ibc.applications.transfer.v1.MsgTransfer')
    })
  })
})
