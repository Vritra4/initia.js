import { describe, it, expect } from 'vitest'
import { initiaChain } from '../../src/chains/initia'
import { minievmChain } from '../../src/chains/minievm'
import { minimoveChain } from '../../src/chains/minimove'
import { miniwasmChain } from '../../src/chains/miniwasm'
import { createBaseConfig } from '../../src/chains/common'
import { coin } from '../../src/core/coin'

describe('chain configs', () => {
  describe('initia', () => {
    const config = initiaChain.build()

    it('has move query and msg builders', () => {
      expect(config.services.move).toBeDefined()
      expect(typeof config.msgs.move.execute).toBe('function')
      expect(typeof config.msgs.move.publish).toBe('function')
    })

    it('has bank from common base', () => {
      expect(config.services.bank).toBeDefined()
      expect(typeof config.msgs.bank.send).toBe('function')
    })

    it('has ophost', () => {
      expect(config.services.ophost).toBeDefined()
      expect(typeof config.msgs.ophost.createBridge).toBe('function')
    })

    it('testnet overrides gov', () => {
      const testnet = initiaChain.build('testnet')
      expect(testnet.services.gov).not.toBe(config.services.gov)
    })

    it('all tx-only modules have callable builders', () => {
      const txOnlyModules = [
        'reward',
        'initiaBank',
        'dynamicFee',
        'ibcHooks',
        'interTx',
        'initiaDistribution',
        'initiaGov',
        'slashing',
        'evidence',
        'upgrade',
        'consensus',
        'group',
        'crisis',
        'cosmosAuth',
        'vesting',
        'nftTransfer',
        'perm',
      ] as const

      const msgs = config.msgs as unknown as Record<string, Record<string, unknown>>
      for (const mod of txOnlyModules) {
        expect(msgs[mod], `module "${mod}" should exist in msgs`).toBeDefined()
        const methods = Object.keys(msgs[mod])
        expect(methods.length, `module "${mod}" should have at least one method`).toBeGreaterThan(0)
        for (const method of methods) {
          expect(typeof msgs[mod][method], `${mod}.${method} should be a function`).toBe('function')
        }
      }
    })

    it('registry can resolve MsgSend (from common base)', () => {
      const desc = config.registry.getMessage('cosmos.bank.v1beta1.MsgSend')
      expect(desc).toBeDefined()
    })

    it('registry can resolve initia-specific types', () => {
      // ethsecp256k1 key (type-only registration)
      const desc = config.registry.getMessage('initia.crypto.v1beta1.ethsecp256k1.PubKey')
      expect(desc).toBeDefined()
    })

    it('testnet can decode mainnet gov v1 msgs (cross-network decode)', () => {
      const mainnetGov = config.msgs.gov.vote({
        proposalId: 1n,
        voter: 'init1voter',
        option: 1,
        metadata: '',
      })
      expect(mainnetGov.typeUrl).toBe('/cosmos.gov.v1.MsgVote')

      const testnet = initiaChain.build('testnet')
      // testnet uses gov v1beta1, but should still decode mainnet gov v1 msgs
      expect(() => testnet.msgs.decode(mainnetGov.toAny())).not.toThrow()
    })
  })

  describe('minievm', () => {
    const config = minievmChain.build()

    it('has evm module', () => {
      expect(config.services.evm).toBeDefined()
      expect(typeof config.msgs.evm.call).toBe('function')
      expect(typeof config.msgs.evm.create).toBe('function')
    })

    it('has opchild module', () => {
      expect(config.services.opchild).toBeDefined()
      expect(typeof config.msgs.opchild.executeMessages).toBe('function')
    })

    it('inherits bank from common base', () => {
      expect(config.services.bank).toBeDefined()
      expect(typeof config.msgs.bank.send).toBe('function')
    })

    it('registry can resolve evm msg types', () => {
      const desc = config.registry.getMessage('minievm.evm.v1.MsgCall')
      expect(desc).toBeDefined()
    })
  })

  describe('minimove', () => {
    const config = minimoveChain.build()

    it('has move + opchild', () => {
      expect(typeof config.msgs.move.execute).toBe('function')
      expect(typeof config.msgs.opchild.executeMessages).toBe('function')
    })

    it('registry can resolve move msg types', () => {
      const desc = config.registry.getMessage('initia.move.v1.MsgExecute')
      expect(desc).toBeDefined()
    })
  })

  describe('miniwasm', () => {
    const config = miniwasmChain.build()

    it('has wasm + opchild', () => {
      expect(config.services.wasm).toBeDefined()
      expect(typeof config.msgs.opchild.executeMessages).toBe('function')
    })

    it('registry can resolve wasm msg types', () => {
      const desc = config.registry.getMessage('cosmwasm.wasm.v1.MsgExecuteContract')
      expect(desc).toBeDefined()
    })
  })

  describe('common base', () => {
    const config = createBaseConfig().build()

    it('has all expected query services', () => {
      expect(config.services.auth).toBeDefined()
      expect(config.services.bank).toBeDefined()
      expect(config.services.tx).toBeDefined()
      expect(config.services.tendermint).toBeDefined()
    })

    it('has all expected tx modules', () => {
      const txModules = ['bank', 'ibc', 'ibcCore', 'ibcFee', 'ibcIca', 'authz', 'feegrant'] as const
      const msgs = config.msgs as unknown as Record<string, Record<string, unknown>>
      for (const mod of txModules) {
        expect(msgs[mod], `module "${mod}" should exist`).toBeDefined()
      }
    })

    it('registry has crypto key types (for Any decode)', () => {
      expect(config.registry.getMessage('cosmos.crypto.ed25519.PubKey')).toBeDefined()
      expect(config.registry.getMessage('cosmos.crypto.secp256k1.PubKey')).toBeDefined()
    })

    it('decode round-trips a bank.send message', () => {
      const msg = config.msgs.bank.send({
        fromAddress: 'init1a',
        toAddress: 'init1b',
        amount: [coin('uinit', '1000')],
      })
      const decoded = config.msgs.decode(msg.toAny())
      expect(decoded.typeUrl).toBe('/cosmos.bank.v1beta1.MsgSend')
    })
  })
})
