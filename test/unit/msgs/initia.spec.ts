/**
 * Unit tests for Initia L1 message builders (ChainConfigBuilder API).
 */

import { describe, it, expect } from 'vitest'
import { initiaChain } from '../../../src/chains/initia'
import { coin } from '../../../src/core/coin'
import { Message } from '../../../src/msgs/types'
import { create } from '@bufbuild/protobuf'
import { AnySchema } from '@bufbuild/protobuf/wkt'
import { MsgSendSchema } from '@initia/initia-proto/cosmos/bank/v1beta1/tx_pb'

const initiaMsgs = initiaChain.build().msgs

describe('initiaMsgs', () => {
  describe('bank.send', () => {
    it('should create a MsgSend', () => {
      const msg = initiaMsgs.bank.send({
        fromAddress: 'init1sender...',
        toAddress: 'init1receiver...',
        amount: coin('uinit', '1000000'),
      })

      expect(msg.toAny().typeUrl).toBe('/cosmos.bank.v1beta1.MsgSend')
    })
  })

  describe('ibc.transfer', () => {
    it('should create a MsgTransfer', () => {
      const msg = initiaMsgs.ibc.transfer({
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
    })
  })

  describe('mstaking.delegate', () => {
    it('should create a MsgDelegate', () => {
      const msg = initiaMsgs.mstaking.delegate({
        delegatorAddress: 'init1delegator...',
        validatorAddress: 'initvaloper1validator...',
        amount: [coin('uinit', '1000000')],
      })

      expect(msg.toAny().typeUrl).toBe('/initia.mstaking.v1.MsgDelegate')
      expect(msg.value).toBeDefined()
    })
  })

  describe('mstaking.undelegate', () => {
    it('should create a MsgUndelegate', () => {
      const msg = initiaMsgs.mstaking.undelegate({
        delegatorAddress: 'init1delegator...',
        validatorAddress: 'initvaloper1validator...',
        amount: [coin('uinit', '1000000')],
      })

      expect(msg.toAny().typeUrl).toBe('/initia.mstaking.v1.MsgUndelegate')
      expect(msg.value).toBeDefined()
    })
  })

  describe('mstaking.beginRedelegate', () => {
    it('should create a MsgBeginRedelegate', () => {
      const msg = initiaMsgs.mstaking.beginRedelegate({
        delegatorAddress: 'init1delegator...',
        validatorSrcAddress: 'initvaloper1src...',
        validatorDstAddress: 'initvaloper1dst...',
        amount: [coin('uinit', '1000000')],
      })

      expect(msg.toAny().typeUrl).toBe('/initia.mstaking.v1.MsgBeginRedelegate')
      expect(msg.value).toBeDefined()
    })
  })

  describe('distribution.withdrawDelegatorReward', () => {
    it('should create a MsgWithdrawDelegatorReward', () => {
      const msg = initiaMsgs.distribution.withdrawDelegatorReward({
        delegatorAddress: 'init1delegator...',
        validatorAddress: 'initvaloper1validator...',
      })

      expect(msg.toAny().typeUrl).toBe('/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward')
      expect(msg.value).toBeDefined()
    })
  })

  describe('move.execute', () => {
    it('should create a MsgExecute for Move function', () => {
      const msg = initiaMsgs.move.execute({
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
      const msg = initiaMsgs.move.execute({
        sender: 'init1sender...',
        moduleAddress: 'init1module...',
        moduleName: 'my_module',
        functionName: 'my_function',
        typeArgs: [],
        args: [],
      })

      expect(msg.toAny().typeUrl).toBe('/initia.move.v1.MsgExecute')
    })
  })

  describe('move.script', () => {
    it('should create a MsgScript', () => {
      const codeBytes = new Uint8Array([0x00, 0x01, 0x02, 0x03])
      const msg = initiaMsgs.move.script({
        sender: 'init1sender...',
        codeBytes,
        typeArgs: [],
        args: [],
      })

      expect(msg.toAny().typeUrl).toBe('/initia.move.v1.MsgScript')
      expect(msg.value).toBeDefined()
    })
  })

  describe('gov.vote', () => {
    it('should create a MsgVote with yes option', () => {
      const msg = initiaMsgs.gov.vote({
        proposalId: 1n,
        voter: 'init1voter...',
        option: 1,
        metadata: '',
      })

      expect(msg.toAny().typeUrl).toBe('/cosmos.gov.v1.MsgVote')
      expect(msg.value).toBeDefined()
    })
  })

  describe('gov.deposit', () => {
    it('should create a MsgDeposit', () => {
      const msg = initiaMsgs.gov.deposit({
        proposalId: 1n,
        depositor: 'init1depositor...',
        amount: [coin('uinit', '1000000')],
      })

      expect(msg.toAny().typeUrl).toBe('/cosmos.gov.v1.MsgDeposit')
      expect(msg.value).toBeDefined()
    })
  })

  describe('authz.grant', () => {
    it('should create a MsgGrant with authorization', () => {
      const authAny = create(AnySchema, {
        typeUrl: '/cosmos.authz.v1beta1.GenericAuthorization',
        value: new Uint8Array([10, 30, 47, 99, 111, 115, 109, 111, 115]),
      })

      const msg = initiaMsgs.authz.grant({
        granter: 'init1granter...',
        grantee: 'init1grantee...',
        grant: { authorization: authAny },
      })

      expect(msg.toAny().typeUrl).toBe('/cosmos.authz.v1beta1.MsgGrant')
      expect(msg.value).toBeDefined()
    })
  })

  describe('authz.exec', () => {
    it('should create a MsgExec with messages', () => {
      const sendMsg = initiaMsgs.bank.send({
        fromAddress: 'init1from...',
        toAddress: 'init1to...',
        amount: coin('uinit', '1000000'),
      })

      const msg = initiaMsgs.authz.exec({
        grantee: 'init1grantee...',
        msgs: [sendMsg.toAny()],
      })

      expect(msg.toAny().typeUrl).toBe('/cosmos.authz.v1beta1.MsgExec')
      expect(msg.value).toBeDefined()
    })
  })

  describe('authz.revoke', () => {
    it('should create a MsgRevoke', () => {
      const msg = initiaMsgs.authz.revoke({
        granter: 'init1granter...',
        grantee: 'init1grantee...',
        msgTypeUrl: '/cosmos.bank.v1beta1.MsgSend',
      })

      expect(msg.toAny().typeUrl).toBe('/cosmos.authz.v1beta1.MsgRevoke')
      expect(msg.value).toBeDefined()
    })
  })

  describe('feegrant.grantAllowance', () => {
    it('should create a MsgGrantAllowance', () => {
      const authAny = create(AnySchema, {
        typeUrl: '/cosmos.feegrant.v1beta1.BasicAllowance',
        value: new Uint8Array([]),
      })

      const msg = initiaMsgs.feegrant.grantAllowance({
        granter: 'init1granter...',
        grantee: 'init1grantee...',
        allowance: authAny,
      })

      expect(msg.toAny().typeUrl).toBe('/cosmos.feegrant.v1beta1.MsgGrantAllowance')
      expect(msg.value).toBeDefined()
    })
  })

  describe('feegrant.revokeAllowance', () => {
    it('should create a MsgRevokeAllowance', () => {
      const msg = initiaMsgs.feegrant.revokeAllowance({
        granter: 'init1granter...',
        grantee: 'init1grantee...',
      })

      expect(msg.toAny().typeUrl).toBe('/cosmos.feegrant.v1beta1.MsgRevokeAllowance')
      expect(msg.value).toBeDefined()
    })
  })

  describe('group.createGroup', () => {
    it('should create a MsgCreateGroup', () => {
      const msg = initiaMsgs.group.createGroup({
        admin: 'init1admin...',
        members: [
          { address: 'init1member1...', weight: '1', metadata: '' },
          { address: 'init1member2...', weight: '2', metadata: '' },
        ],
        metadata: '',
      })

      expect(msg.toAny().typeUrl).toBe('/cosmos.group.v1.MsgCreateGroup')
      expect(msg.value).toBeDefined()
    })

    it('should create a MsgCreateGroup with metadata', () => {
      const msg = initiaMsgs.group.createGroup({
        admin: 'init1admin...',
        members: [{ address: 'init1member...', weight: '1', metadata: '' }],
        metadata: 'group metadata',
      })

      expect(msg.toAny().typeUrl).toBe('/cosmos.group.v1.MsgCreateGroup')
    })
  })

  describe('custom', () => {
    it('should create a custom message from schema', () => {
      const msg = initiaMsgs.custom(MsgSendSchema, {
        fromAddress: 'init1sender...',
        toAddress: 'init1receiver...',
        amount: coin('uinit', '1000000'),
      })

      expect(msg.toAny().typeUrl).toBe('/cosmos.bank.v1beta1.MsgSend')
      expect(msg).toBeInstanceOf(Message)
    })
  })
})
