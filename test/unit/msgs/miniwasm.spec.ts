/**
 * Unit tests for Miniwasm rollup message builders (ChainConfigBuilder API).
 */

import { describe, it, expect } from 'vitest'
import { miniwasmChain } from '../../../src/chains/miniwasm'
import { coin } from '../../../src/core/coin'
import { Message } from '../../../src/msgs/types'

const miniwasmMsgs = miniwasmChain.build().msgs

const encode = (obj: unknown) => new TextEncoder().encode(JSON.stringify(obj))

describe('miniwasmMsgs', () => {
  describe('wasm.instantiateContract', () => {
    it('should create a MsgInstantiateContract', () => {
      const msg = miniwasmMsgs.wasm.instantiateContract({
        sender: 'init1sender...',
        admin: '',
        codeId: 1n,
        label: 'my-counter',
        msg: encode({ count: 0 }),
        funds: [],
      })

      expect(msg.toAny().typeUrl).toBe('/cosmwasm.wasm.v1.MsgInstantiateContract')
      expect(msg.value).toBeDefined()
    })

    it('should create a MsgInstantiateContract with funds', () => {
      const msg = miniwasmMsgs.wasm.instantiateContract({
        sender: 'init1sender...',
        admin: '',
        codeId: 1n,
        label: 'my-token',
        msg: encode({ owner: 'init1owner...' }),
        funds: [coin('umin', '1000000')],
      })

      expect(msg.toAny().typeUrl).toBe('/cosmwasm.wasm.v1.MsgInstantiateContract')
      expect(msg).toBeInstanceOf(Message)
    })
  })

  describe('wasm.executeContract', () => {
    it('should create a MsgExecuteContract', () => {
      const msg = miniwasmMsgs.wasm.executeContract({
        sender: 'init1sender...',
        contract: 'init1contract...',
        msg: encode({ increment: {} }),
        funds: [],
      })

      expect(msg.toAny().typeUrl).toBe('/cosmwasm.wasm.v1.MsgExecuteContract')
      expect(msg.value).toBeDefined()
    })

    it('should create a MsgExecuteContract with funds', () => {
      const msg = miniwasmMsgs.wasm.executeContract({
        sender: 'init1sender...',
        contract: 'init1contract...',
        msg: encode({ buy_token: { amount: '100' } }),
        funds: [coin('umin', '500000')],
      })

      expect(msg.toAny().typeUrl).toBe('/cosmwasm.wasm.v1.MsgExecuteContract')
      expect(msg).toBeInstanceOf(Message)
    })
  })

  describe('wasm.migrateContract', () => {
    it('should create a MsgMigrateContract', () => {
      const msg = miniwasmMsgs.wasm.migrateContract({
        sender: 'init1admin...',
        contract: 'init1contract...',
        codeId: 2n,
        msg: encode({}),
      })

      expect(msg.toAny().typeUrl).toBe('/cosmwasm.wasm.v1.MsgMigrateContract')
      expect(msg.value).toBeDefined()
    })

    it('should create a MsgMigrateContract with migration msg', () => {
      const msg = miniwasmMsgs.wasm.migrateContract({
        sender: 'init1admin...',
        contract: 'init1contract...',
        codeId: 5n,
        msg: encode({ new_owner: 'init1newowner...' }),
      })

      expect(msg.toAny().typeUrl).toBe('/cosmwasm.wasm.v1.MsgMigrateContract')
      expect(msg).toBeInstanceOf(Message)
    })
  })

  describe('wasm.storeCode', () => {
    it('should create a MsgStoreCode', () => {
      const wasmBytecode = new Uint8Array([0x00, 0x61, 0x73, 0x6d])
      const msg = miniwasmMsgs.wasm.storeCode({
        sender: 'init1sender...',
        wasmByteCode: wasmBytecode,
        instantiatePermission: undefined,
      })

      expect(msg.toAny().typeUrl).toBe('/cosmwasm.wasm.v1.MsgStoreCode')
      expect(msg.value).toBeDefined()
    })
  })

  describe('bank.send', () => {
    it('should have send method', () => {
      const msg = miniwasmMsgs.bank.send({
        fromAddress: 'init1from...',
        toAddress: 'init1to...',
        amount: coin('umin', '1000000'),
      })

      expect(msg.toAny().typeUrl).toBe('/cosmos.bank.v1beta1.MsgSend')
    })
  })

  describe('ibc.transfer', () => {
    it('should have transfer method', () => {
      const msg = miniwasmMsgs.ibc.transfer({
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
