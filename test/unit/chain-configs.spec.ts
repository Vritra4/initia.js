import { describe, it, expect } from 'vitest'
import { initiaChain } from '../../src/chains/initia'
import { minievmChain } from '../../src/chains/minievm'
import { minimoveChain } from '../../src/chains/minimove'
import { miniwasmChain } from '../../src/chains/miniwasm'

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
  })

  describe('minimove', () => {
    const config = minimoveChain.build()
    it('has move + opchild', () => {
      expect(typeof config.msgs.move.execute).toBe('function')
      expect(typeof config.msgs.opchild.executeMessages).toBe('function')
    })
  })

  describe('miniwasm', () => {
    const config = miniwasmChain.build()
    it('has wasm + opchild', () => {
      expect(config.services.wasm).toBeDefined()
      expect(typeof config.msgs.opchild.executeMessages).toBe('function')
    })
  })
})
