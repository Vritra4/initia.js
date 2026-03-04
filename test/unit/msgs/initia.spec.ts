/**
 * Unit tests for Initia L1 message builders.
 */

import { describe, it, expect } from 'vitest'
import { initiaMsgs } from '../../../src/msgs/initia'
import { coin } from '../../../src/core/coin'
import { Message } from '../../../src/msgs/types'
import { create } from '@bufbuild/protobuf'
import { AnySchema } from '@bufbuild/protobuf/wkt'

describe('initiaMsgs', () => {
  // ============= Staking (mstaking) =============

  describe('delegate', () => {
    it('should create a MsgDelegate with single coin', () => {
      const msg = initiaMsgs.delegate(
        'init1delegator...',
        'initvaloper1validator...',
        coin('uinit', '1000000')
      )

      expect(msg.toAny().typeUrl).toBe(`/initia.mstaking.v1.MsgDelegate`)
      expect(msg.value).toBeDefined()
    })

    it('should create a MsgDelegate with multiple coins', () => {
      const msg = initiaMsgs.delegate('init1delegator...', 'initvaloper1validator...', [
        coin('uinit', '1000000'),
        coin('uusdc', '500000'),
      ])

      expect(msg.toAny().typeUrl).toBe(`/initia.mstaking.v1.MsgDelegate`)
    })
  })

  describe('undelegate', () => {
    it('should create a MsgUndelegate', () => {
      const msg = initiaMsgs.undelegate(
        'init1delegator...',
        'initvaloper1validator...',
        coin('uinit', '1000000')
      )

      expect(msg.toAny().typeUrl).toBe(`/initia.mstaking.v1.MsgUndelegate`)
      expect(msg.value).toBeDefined()
    })
  })

  describe('redelegate', () => {
    it('should create a MsgBeginRedelegate', () => {
      const msg = initiaMsgs.redelegate(
        'init1delegator...',
        'initvaloper1src...',
        'initvaloper1dst...',
        coin('uinit', '1000000')
      )

      expect(msg.toAny().typeUrl).toBe(`/initia.mstaking.v1.MsgBeginRedelegate`)
      expect(msg.value).toBeDefined()
    })
  })

  describe('withdrawRewards', () => {
    it('should create a MsgWithdrawDelegatorReward', () => {
      const msg = initiaMsgs.withdrawRewards('init1delegator...', 'initvaloper1validator...')

      expect(msg.toAny().typeUrl).toBe(`/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward`)
      expect(msg.value).toBeDefined()
    })
  })

  // ============= Move =============

  describe('execute', () => {
    it('should create a MsgExecute for Move function', () => {
      const msg = initiaMsgs.execute(
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
      const msg = initiaMsgs.execute(
        'init1sender...',
        'init1module...',
        'my_module',
        'my_function',
        [],
        []
      )

      expect(msg.toAny().typeUrl).toBe(`/initia.move.v1.MsgExecute`)
    })
  })

  describe('script', () => {
    it('should create a MsgScript', () => {
      const codeBytes = new Uint8Array([0x00, 0x01, 0x02, 0x03])
      const msg = initiaMsgs.script('init1sender...', codeBytes, [], [])

      expect(msg.toAny().typeUrl).toBe(`/initia.move.v1.MsgScript`)
      expect(msg.value).toBeDefined()
    })
  })

  // ============= Governance =============

  describe('vote', () => {
    it('should create a MsgVote with yes option', () => {
      const msg = initiaMsgs.vote(1n, 'init1voter...', 1) // 1 = yes

      expect(msg.toAny().typeUrl).toBe(`/cosmos.gov.v1.MsgVote`)
      expect(msg.value).toBeDefined()
    })

    it('should create a MsgVote with different options', () => {
      // 1=yes, 2=abstain, 3=no, 4=no_with_veto
      expect(initiaMsgs.vote(1n, 'init1voter...', 2).toAny().typeUrl).toBe(`/cosmos.gov.v1.MsgVote`)
      expect(initiaMsgs.vote(1n, 'init1voter...', 3).toAny().typeUrl).toBe(`/cosmos.gov.v1.MsgVote`)
      expect(initiaMsgs.vote(1n, 'init1voter...', 4).toAny().typeUrl).toBe(`/cosmos.gov.v1.MsgVote`)
    })
  })

  describe('deposit', () => {
    it('should create a MsgDeposit', () => {
      const msg = initiaMsgs.deposit(1n, 'init1depositor...', [coin('uinit', '1000000')])

      expect(msg.toAny().typeUrl).toBe(`/cosmos.gov.v1.MsgDeposit`)
      expect(msg.value).toBeDefined()
    })
  })

  // ============= Authz =============

  describe('authzGrant', () => {
    it('should create a MsgGrant with authorization', () => {
      // Create a simple GenericAuthorization wrapped as Message
      const authAny = create(AnySchema, {
        typeUrl: `/cosmos.authz.v1beta1.GenericAuthorization`,
        value: new Uint8Array([10, 30, 47, 99, 111, 115, 109, 111, 115]),
      })
      const authorization = Message.fromAny(authAny)

      const msg = initiaMsgs.authzGrant('init1granter...', 'init1grantee...', authorization)

      expect(msg.toAny().typeUrl).toBe(`/cosmos.authz.v1beta1.MsgGrant`)
      expect(msg.value).toBeDefined()
    })

    it('should create a MsgGrant with expiration', () => {
      const authAny = create(AnySchema, {
        typeUrl: `/cosmos.authz.v1beta1.GenericAuthorization`,
        value: new Uint8Array([10, 30]),
      })
      const authorization = Message.fromAny(authAny)
      const expiration = new Date('2025-12-31T23:59:59Z')

      const msg = initiaMsgs.authzGrant(
        'init1granter...',
        'init1grantee...',
        authorization,
        expiration
      )

      expect(msg.toAny().typeUrl).toBe(`/cosmos.authz.v1beta1.MsgGrant`)
    })
  })

  describe('authzExec', () => {
    it('should create a MsgExec with messages', () => {
      const sendMsg = initiaMsgs.send('init1from...', 'init1to...', coin('uinit', '1000000'))

      const msg = initiaMsgs.authzExec('init1grantee...', [sendMsg])

      expect(msg.toAny().typeUrl).toBe(`/cosmos.authz.v1beta1.MsgExec`)
      expect(msg.value).toBeDefined()
    })

    it('should create a MsgExec with multiple messages', () => {
      const msgs = [
        initiaMsgs.send('init1from...', 'init1to1...', coin('uinit', '100')),
        initiaMsgs.send('init1from...', 'init1to2...', coin('uinit', '200')),
      ]

      const msg = initiaMsgs.authzExec('init1grantee...', msgs)

      expect(msg.toAny().typeUrl).toBe(`/cosmos.authz.v1beta1.MsgExec`)
    })
  })

  describe('authzRevoke', () => {
    it('should create a MsgRevoke', () => {
      const msg = initiaMsgs.authzRevoke(
        'init1granter...',
        'init1grantee...',
        '/cosmos.bank.v1beta1.MsgSend'
      )

      expect(msg.toAny().typeUrl).toBe(`/cosmos.authz.v1beta1.MsgRevoke`)
      expect(msg.value).toBeDefined()
    })
  })

  // ============= Feegrant =============

  describe('grantAllowance', () => {
    it('should create a MsgGrantAllowance with default options', () => {
      const msg = initiaMsgs.grantAllowance('init1granter...', 'init1grantee...')

      expect(msg.toAny().typeUrl).toBe(`/cosmos.feegrant.v1beta1.MsgGrantAllowance`)
      expect(msg.value).toBeDefined()
    })

    it('should create a MsgGrantAllowance with spend limit', () => {
      const msg = initiaMsgs.grantAllowance('init1granter...', 'init1grantee...', {
        spendLimit: [coin('uinit', '1000000')],
      })

      expect(msg.toAny().typeUrl).toBe(`/cosmos.feegrant.v1beta1.MsgGrantAllowance`)
    })

    it('should create a MsgGrantAllowance with expiration', () => {
      const msg = initiaMsgs.grantAllowance('init1granter...', 'init1grantee...', {
        expiration: new Date('2025-12-31T23:59:59Z'),
      })

      expect(msg.toAny().typeUrl).toBe(`/cosmos.feegrant.v1beta1.MsgGrantAllowance`)
    })

    it('should create a MsgGrantAllowance with all options', () => {
      const msg = initiaMsgs.grantAllowance('init1granter...', 'init1grantee...', {
        spendLimit: [coin('uinit', '1000000')],
        expiration: new Date('2025-12-31T23:59:59Z'),
      })

      expect(msg.toAny().typeUrl).toBe(`/cosmos.feegrant.v1beta1.MsgGrantAllowance`)
    })
  })

  describe('revokeAllowance', () => {
    it('should create a MsgRevokeAllowance', () => {
      const msg = initiaMsgs.revokeAllowance('init1granter...', 'init1grantee...')

      expect(msg.toAny().typeUrl).toBe(`/cosmos.feegrant.v1beta1.MsgRevokeAllowance`)
      expect(msg.value).toBeDefined()
    })
  })

  // ============= Group =============

  describe('createGroup', () => {
    it('should create a MsgCreateGroup', () => {
      const msg = initiaMsgs.createGroup('init1admin...', [
        { address: 'init1member1...', weight: '1' },
        { address: 'init1member2...', weight: '2' },
      ])

      expect(msg.toAny().typeUrl).toBe(`/cosmos.group.v1.MsgCreateGroup`)
      expect(msg.value).toBeDefined()
    })

    it('should create a MsgCreateGroup with metadata', () => {
      const msg = initiaMsgs.createGroup(
        'init1admin...',
        [{ address: 'init1member...', weight: '1' }],
        'My DAO Group'
      )

      expect(msg.toAny().typeUrl).toBe(`/cosmos.group.v1.MsgCreateGroup`)
    })

    it('should create a MsgCreateGroup with member metadata', () => {
      const msg = initiaMsgs.createGroup('init1admin...', [
        { address: 'init1member...', weight: '1', metadata: 'founder' },
      ])

      expect(msg.toAny().typeUrl).toBe(`/cosmos.group.v1.MsgCreateGroup`)
    })
  })

  describe('groupVote', () => {
    it('should create a MsgVote for group proposal', () => {
      const msg = initiaMsgs.groupVote(1n, 'init1voter...', 1) // 1 = yes

      expect(msg.toAny().typeUrl).toBe(`/cosmos.group.v1.MsgVote`)
      expect(msg.value).toBeDefined()
    })

    it('should create a MsgVote with metadata', () => {
      const msg = initiaMsgs.groupVote(1n, 'init1voter...', 1, 'I support this proposal')

      expect(msg.toAny().typeUrl).toBe(`/cosmos.group.v1.MsgVote`)
    })
  })

  // ============= Object Syntax Overloads =============

  describe('delegate (object syntax)', () => {
    it('should produce identical result to positional syntax', () => {
      const positional = initiaMsgs.delegate('init1d...', 'initvaloper1v...', coin('uinit', '1000'))
      const object = initiaMsgs.delegate({
        delegator: 'init1d...',
        validator: 'initvaloper1v...',
        amount: coin('uinit', '1000'),
      })

      expect(object.toAny().value).toEqual(positional.toAny().value)
    })
  })

  describe('redelegate (object syntax)', () => {
    it('should produce identical result to positional syntax', () => {
      const positional = initiaMsgs.redelegate(
        'init1d...',
        'initvaloper1s...',
        'initvaloper1d...',
        coin('uinit', '1000')
      )
      const object = initiaMsgs.redelegate({
        delegator: 'init1d...',
        srcValidator: 'initvaloper1s...',
        dstValidator: 'initvaloper1d...',
        amount: coin('uinit', '1000'),
      })

      expect(object.toAny().value).toEqual(positional.toAny().value)
    })
  })

  describe('execute (object syntax)', () => {
    it('should produce identical result to positional syntax', () => {
      const args = [new Uint8Array([1, 2])]
      const positional = initiaMsgs.execute(
        'init1s...',
        'init1m...',
        'mod',
        'fn',
        ['0x1::string::String'],
        args
      )
      const object = initiaMsgs.execute({
        sender: 'init1s...',
        moduleAddress: 'init1m...',
        moduleName: 'mod',
        functionName: 'fn',
        typeArgs: ['0x1::string::String'],
        args,
      })

      expect(object.toAny().value).toEqual(positional.toAny().value)
    })
  })

  // ============= Inherited from BaseMsgs =============

  describe('inherited send', () => {
    it('should have send method from baseMsgs', () => {
      const msg = initiaMsgs.send('init1from...', 'init1to...', coin('uinit', '1000000'))

      expect(msg.toAny().typeUrl).toBe(`/cosmos.bank.v1beta1.MsgSend`)
    })
  })

  describe('inherited transfer', () => {
    it('should have transfer method from baseMsgs', () => {
      const msg = initiaMsgs.transfer(
        'init1sender...',
        'init1receiver...',
        coin('uinit', '1000000'),
        'channel-0'
      )

      expect(msg.toAny().typeUrl).toBe(`/ibc.applications.transfer.v1.MsgTransfer`)
    })
  })
})
