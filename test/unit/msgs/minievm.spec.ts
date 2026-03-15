/**
 * Unit tests for Minievm rollup message builders (ChainConfigBuilder API).
 */

import { describe, it, expect } from 'vitest'
import { minievmChain } from '../../../src/chains/minievm'
import { coin } from '../../../src/core/coin'
import { Message } from '../../../src/msgs/types'

const minievmMsgs = minievmChain.build().msgs

describe('minievmMsgs', () => {
  describe('evm.create', () => {
    it('should create a MsgCreate for contract deployment', () => {
      const msg = minievmMsgs.evm.create({
        sender: 'init1sender...',
        code: '0x60806040',
        value: '',
        accessList: [],
      })

      expect(msg.toAny().typeUrl).toBe('/minievm.evm.v1.MsgCreate')
      expect(msg.value).toBeDefined()
    })

    it('should create a MsgCreate with all required fields', () => {
      const msg = minievmMsgs.evm.create({
        sender: 'init1sender...',
        code: '0x6080604052',
        value: '',
        accessList: [],
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
        value: '',
        accessList: [],
        authList: [],
      })

      expect(msg.toAny().typeUrl).toBe('/minievm.evm.v1.MsgCall')
      expect(msg.value).toBeDefined()
    })

    it('should have empty value when not provided', () => {
      const msg = minievmMsgs.evm.call({
        sender: 'init1sender...',
        contractAddr: '0xcontract...',
        input: '0x00',
        value: '',
        accessList: [],
        authList: [],
      })

      expect(msg.value.value).toBe('')
    })

    it('should use explicit value when provided', () => {
      const msg = minievmMsgs.evm.call({
        sender: 'init1sender...',
        contractAddr: '0xcontract...',
        input: '0x00',
        value: '100',
        accessList: [],
        authList: [],
      })

      expect(msg.value.value).toBe('100')
    })
  })

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
        sourcePort: 'transfer',
        timeoutHeight: { revisionNumber: 0n, revisionHeight: 0n },
        timeoutTimestamp: BigInt(Date.now() + 10 * 60_000) * 1_000_000n,
        memo: '',
      })

      expect(msg.toAny().typeUrl).toBe('/ibc.applications.transfer.v1.MsgTransfer')
    })
  })
})
