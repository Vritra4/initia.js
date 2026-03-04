/**
 * Unit tests for Miniwasm rollup message builders.
 */

import { describe, it, expect } from 'vitest'
import { miniwasmMsgs } from '../../../src/msgs/miniwasm'
import { coin } from '../../../src/core/coin'
import { Message } from '../../../src/msgs/types'

describe('miniwasmMsgs', () => {
  // ============= CosmWasm =============

  describe('instantiate', () => {
    it('should create a MsgInstantiateContract', () => {
      const msg = miniwasmMsgs.instantiate('init1sender...', 1n, { count: 0 }, 'my-counter')

      expect(msg.toAny().typeUrl).toBe(`/cosmwasm.wasm.v1.MsgInstantiateContract`)
      expect(msg.value).toBeDefined()
    })

    it('should create a MsgInstantiateContract with funds', () => {
      const msg = miniwasmMsgs.instantiate(
        'init1sender...',
        1n,
        { owner: 'init1owner...' },
        'my-token',
        [coin('umin', '1000000')]
      )

      expect(msg.toAny().typeUrl).toBe(`/cosmwasm.wasm.v1.MsgInstantiateContract`)
      expect(msg).toBeInstanceOf(Message)
    })

    it('should create a MsgInstantiateContract with empty funds', () => {
      const msg = miniwasmMsgs.instantiate(
        'init1sender...',
        100n,
        { name: 'test', symbol: 'TST' },
        'test-contract',
        []
      )

      expect(msg.toAny().typeUrl).toBe(`/cosmwasm.wasm.v1.MsgInstantiateContract`)
    })
  })

  describe('executeContract', () => {
    it('should create a MsgExecuteContract', () => {
      const msg = miniwasmMsgs.executeContract('init1sender...', 'init1contract...', {
        increment: {},
      })

      expect(msg.toAny().typeUrl).toBe(`/cosmwasm.wasm.v1.MsgExecuteContract`)
      expect(msg.value).toBeDefined()
    })

    it('should create a MsgExecuteContract with funds', () => {
      const msg = miniwasmMsgs.executeContract(
        'init1sender...',
        'init1contract...',
        { buy_token: { amount: '100' } },
        [coin('umin', '500000')]
      )

      expect(msg.toAny().typeUrl).toBe(`/cosmwasm.wasm.v1.MsgExecuteContract`)
      expect(msg).toBeInstanceOf(Message)
    })

    it('should create a MsgExecuteContract with multiple funds', () => {
      const msg = miniwasmMsgs.executeContract('init1sender...', 'init1contract...', { swap: {} }, [
        coin('umin', '1000000'),
        coin('uusdc', '500000'),
      ])

      expect(msg.toAny().typeUrl).toBe(`/cosmwasm.wasm.v1.MsgExecuteContract`)
    })
  })

  describe('migrate', () => {
    it('should create a MsgMigrateContract', () => {
      const msg = miniwasmMsgs.migrate('init1admin...', 'init1contract...', 2n, {})

      expect(msg.toAny().typeUrl).toBe(`/cosmwasm.wasm.v1.MsgMigrateContract`)
      expect(msg.value).toBeDefined()
    })

    it('should create a MsgMigrateContract with migration msg', () => {
      const msg = miniwasmMsgs.migrate('init1admin...', 'init1contract...', 5n, {
        new_owner: 'init1newowner...',
      })

      expect(msg.toAny().typeUrl).toBe(`/cosmwasm.wasm.v1.MsgMigrateContract`)
      expect(msg).toBeInstanceOf(Message)
    })
  })

  // ============= Inherited from BaseMsgs =============

  describe('inherited send', () => {
    it('should have send method from baseMsgs', () => {
      const msg = miniwasmMsgs.send('init1from...', 'init1to...', coin('umin', '1000000'))

      expect(msg.toAny().typeUrl).toBe(`/cosmos.bank.v1beta1.MsgSend`)
    })
  })

  describe('inherited transfer', () => {
    it('should have transfer method from baseMsgs', () => {
      const msg = miniwasmMsgs.transfer(
        'init1sender...',
        'init1receiver...',
        coin('umin', '1000000'),
        'channel-0'
      )

      expect(msg.toAny().typeUrl).toBe(`/ibc.applications.transfer.v1.MsgTransfer`)
    })
  })
})
