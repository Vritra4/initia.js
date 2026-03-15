import { describe, it, expect } from 'vitest'
import { createChainConfig } from '../../src/chain-config'
import { Msg as BankTxMsg } from '@initia/initia-proto/cosmos/bank/v1beta1/tx_pb'
import { Query as BankQuery } from '@initia/initia-proto/cosmos/bank/v1beta1/query_pb'
import { Query as AuthQuery } from '@initia/initia-proto/cosmos/auth/v1beta1/query_pb'
import { Msg as MoveTxMsg } from '@initia/initia-proto/initia/move/v1/tx_pb'
import { Query as GovQuery } from '@initia/initia-proto/cosmos/gov/v1/query_pb'
import { Query as GovV1Beta1Query } from '@initia/initia-proto/cosmos/gov/v1beta1/query_pb'
import { Msg as GovTxMsg } from '@initia/initia-proto/cosmos/gov/v1/tx_pb'
import { file_cosmos_crypto_ed25519_keys } from '@initia/initia-proto/cosmos/crypto/ed25519/keys_pb'
import { Msg as ChannelTxMsg } from '@initia/initia-proto/ibc/core/channel/v1/tx_pb'
import { Msg as ClientTxMsg } from '@initia/initia-proto/ibc/core/client/v1/tx_pb'
import { Msg as ConnectionTxMsg } from '@initia/initia-proto/ibc/core/connection/v1/tx_pb'
import { coin } from '../../src/core/coin'

describe('createChainConfig', () => {
  it('returns a ChainConfigBuilder', () => {
    const builder = createChainConfig()
    expect(builder).toBeDefined()
    expect(typeof builder.addModule).toBe('function')
    expect(typeof builder.addTypes).toBe('function')
    expect(typeof builder.forNetwork).toBe('function')
    expect(typeof builder.build).toBe('function')
  })
})

describe('addModule + build', () => {
  it('registers query + tx module', () => {
    const config = createChainConfig()
      .addModule('bank', { query: BankQuery, tx: BankTxMsg })
      .build()

    expect(config.services.bank).toBe(BankQuery)
    expect(typeof config.msgs.bank.send).toBe('function')
    expect(typeof config.msgs.bank.multiSend).toBe('function')
  })

  it('registers query-only module', () => {
    const config = createChainConfig()
      .addModule('auth', { query: AuthQuery })
      .build()

    expect(config.services.auth).toBe(AuthQuery)
  })

  it('registers tx-only module', () => {
    const config = createChainConfig()
      .addModule('move', { tx: MoveTxMsg })
      .build()

    expect(typeof config.msgs.move.execute).toBe('function')
    expect(typeof config.msgs.move.publish).toBe('function')
  })

  it('auto-generated builder creates valid Message', () => {
    const config = createChainConfig()
      .addModule('bank', { query: BankQuery, tx: BankTxMsg })
      .build()

    const msg = config.msgs.bank.send({
      fromAddress: 'init1sender',
      toAddress: 'init1receiver',
      amount: [coin('uinit', '1000000')],
    })

    expect(msg.typeUrl).toBe('/cosmos.bank.v1beta1.MsgSend')
    expect(msg.value.fromAddress).toBe('init1sender')
  })

  it('provides custom() and decode()', () => {
    const config = createChainConfig()
      .addModule('bank', { query: BankQuery, tx: BankTxMsg })
      .build()

    expect(typeof config.msgs.custom).toBe('function')
    expect(typeof config.msgs.decode).toBe('function')
  })

  it('decode() works for registered schemas', () => {
    const config = createChainConfig()
      .addModule('bank', { query: BankQuery, tx: BankTxMsg })
      .build()

    const msg = config.msgs.bank.send({
      fromAddress: 'init1sender',
      toAddress: 'init1receiver',
      amount: [coin('uinit', '1000000')],
    })

    const decoded = config.msgs.decode(msg.toAny())
    expect(decoded.typeUrl).toBe('/cosmos.bank.v1beta1.MsgSend')
  })

  it('rejects empty input', () => {
    expect(() => {
      createChainConfig().addModule('empty', {} as any)
    }).toThrow('at least one of query or tx')
  })
})

describe('immutability', () => {
  it('addModule returns new builder without modifying original', () => {
    const base = createChainConfig()
      .addModule('auth', { query: AuthQuery })

    const extended = base
      .addModule('bank', { query: BankQuery, tx: BankTxMsg })

    const baseConfig = base.build()
    const extendedConfig = extended.build()

    expect(baseConfig.services.auth).toBe(AuthQuery)
    expect((baseConfig.services as any).bank).toBeUndefined()
    expect(extendedConfig.services.auth).toBe(AuthQuery)
    expect(extendedConfig.services.bank).toBe(BankQuery)
  })
})

describe('forNetwork', () => {
  it('overrides module for specific network', () => {
    const builder = createChainConfig()
      .addModule('gov', { query: GovQuery, tx: GovTxMsg })
      .forNetwork('testnet')
        .addModule('gov', { query: GovV1Beta1Query })

    const mainnet = builder.build()
    const testnet = builder.build('testnet')

    expect(mainnet.services.gov).toBe(GovQuery)
    expect(testnet.services.gov).toBe(GovV1Beta1Query)
  })

  it('decode registry includes schemas from all networks', () => {
    const builder = createChainConfig()
      .addModule('bank', { query: BankQuery, tx: BankTxMsg })
      .addModule('gov', { query: GovQuery, tx: GovTxMsg })
      .forNetwork('testnet')
        .addModule('gov', { query: GovV1Beta1Query })

    const mainnet = builder.build()
    const testnet = builder.build('testnet')

    const msg = mainnet.msgs.bank.send({
      fromAddress: 'init1a', toAddress: 'init1b',
      amount: [coin('uinit', '1000')],
    })
    expect(() => mainnet.msgs.decode(msg.toAny())).not.toThrow()
    expect(() => testnet.msgs.decode(msg.toAny())).not.toThrow()
  })
})

describe('addTypes', () => {
  it('returns new builder (copy-on-write)', () => {
    const base = createChainConfig()
    const withTypes = base.addTypes(file_cosmos_crypto_ed25519_keys)

    expect(base).not.toBe(withTypes)
  })

  it('registered types are in registry', () => {
    const config = createChainConfig()
      .addTypes(file_cosmos_crypto_ed25519_keys)
      .build()

    const desc = config.registry.getMessage('cosmos.crypto.ed25519.PubKey')
    expect(desc).toBeDefined()
  })
})

describe('multi-source tx array', () => {
  it('merges methods from multiple services', () => {
    const config = createChainConfig()
      .addModule('ibcCore', { tx: [ChannelTxMsg, ClientTxMsg, ConnectionTxMsg] })
      .build()

    expect(typeof config.msgs.ibcCore.channelOpenInit).toBe('function')
    expect(typeof config.msgs.ibcCore.createClient).toBe('function')
    expect(typeof config.msgs.ibcCore.connectionOpenInit).toBe('function')
  })
})
