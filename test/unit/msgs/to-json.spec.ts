/**
 * Unit tests for Message.toJson().
 */

import { describe, it, expect } from 'vitest'
import { baseMsgs } from '../../../src/msgs/base'
import { initiaMsgs } from '../../../src/msgs/initia'
import { coin } from '../../../src/core/coin'
import { Message } from '../../../src/msgs/types'
import { create } from '@bufbuild/protobuf'
import { AnySchema } from '@bufbuild/protobuf/wkt'

describe('Message.toJson', () => {
  it('should return typeUrl and value for MsgSend', () => {
    const msg = baseMsgs.send('init1from...', 'init1to...', coin('uinit', '1000000'))
    const json = msg.toJson()

    expect(json.typeUrl).toBe('/cosmos.bank.v1beta1.MsgSend')
    expect(json.value).toEqual({
      fromAddress: 'init1from...',
      toAddress: 'init1to...',
      amount: [{ denom: 'uinit', amount: '1000000' }],
    })
  })

  it('should return typeUrl and value for MsgDelegate', () => {
    const msg = initiaMsgs.delegate('init1del...', 'initvaloper1val...', coin('uinit', '5000000'))
    const json = msg.toJson()

    expect(json.typeUrl).toBe('/initia.mstaking.v1.MsgDelegate')
    expect(json.value).toHaveProperty('delegatorAddress', 'init1del...')
    expect(json.value).toHaveProperty('validatorAddress', 'initvaloper1val...')
  })

  it('should return typeUrl and value for Move execute', () => {
    const msg = initiaMsgs.execute(
      'init1sender...',
      'init1module...',
      'my_module',
      'my_function',
      [],
      []
    )
    const json = msg.toJson()

    expect(json.typeUrl).toBe('/initia.move.v1.MsgExecute')
    expect(json.value).toHaveProperty('sender', 'init1sender...')
    expect(json.value).toHaveProperty('moduleName', 'my_module')
    expect(json.value).toHaveProperty('functionName', 'my_function')
  })

  it('should work with multiple coins', () => {
    const msg = baseMsgs.send('init1from...', 'init1to...', [
      coin('uinit', '100'),
      coin('uusdc', '200'),
    ])
    const json = msg.toJson()

    expect(json.value.amount).toEqual([
      { denom: 'uinit', amount: '100' },
      { denom: 'uusdc', amount: '200' },
    ])
  })

  it('should throw for pre-packed Any (fromAny)', () => {
    const any = create(AnySchema, {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: new Uint8Array([10, 5]),
    })
    const msg = Message.fromAny(any)

    expect(() => msg.toJson()).toThrow('Cannot convert pre-packed Any to JSON')
  })

  it('should be usable with map for multiple messages', () => {
    const msgs = [
      baseMsgs.send('init1a...', 'init1b...', coin('uinit', '100')),
      initiaMsgs.delegate('init1a...', 'initvaloper1v...', coin('uinit', '200')),
    ]

    const descriptions = msgs.map(m => m.toJson())

    expect(descriptions).toHaveLength(2)
    expect(descriptions[0].typeUrl).toBe('/cosmos.bank.v1beta1.MsgSend')
    expect(descriptions[1].typeUrl).toBe('/initia.mstaking.v1.MsgDelegate')
  })
})
