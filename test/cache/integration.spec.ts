// test/cache/integration.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { wrapClientWithCache } from '../../src/client/cached-client'
import type { InitiaClient, MinievmClient } from '../../src/client/types'

// Mock service factory - returns both the mock and spy references
function createMockMoveService() {
  const moduleSpy = vi.fn()
  return {
    service: { module: moduleSpy } as Record<string, unknown>,
    spies: { module: moduleSpy },
  }
}

function createMockEvmService() {
  const contractAddrByDenomSpy = vi.fn()
  const denomSpy = vi.fn()
  return {
    service: {
      contractAddrByDenom: contractAddrByDenomSpy,
      denom: denomSpy,
    },
    spies: {
      contractAddrByDenom: contractAddrByDenomSpy,
      denom: denomSpy,
    },
  }
}

describe('wrapClientWithCache', () => {
  describe('move.module() caching', () => {
    it('should cache on first fetch and return cached on second', async () => {
      const moveMock = createMockMoveService()
      const mockResult = { address: '0x1', name: 'coin', friends: [] }
      moveMock.spies.module.mockResolvedValue(mockResult)

      const mockClient = { move: moveMock.service } as unknown as InitiaClient
      const client = wrapClientWithCache(mockClient, 'test-chain')

      // First call - should hit gRPC
      const result1 = await client.move.module({ address: '0x1', moduleName: 'coin' })

      // Second call - should use cache
      const result2 = await client.move.module({ address: '0x1', moduleName: 'coin' })

      expect(result1).toEqual(mockResult)
      expect(result2).toEqual(mockResult)
      expect(moveMock.spies.module).toHaveBeenCalledTimes(1)
    })

    it('should bypass cache with skipCache option', async () => {
      const moveMock = createMockMoveService()
      const mockResult = { address: '0x1', name: 'coin' }
      moveMock.spies.module.mockResolvedValue(mockResult)

      const mockClient = { move: moveMock.service } as unknown as InitiaClient
      const client = wrapClientWithCache(mockClient, 'test-chain')

      await client.move.module({ address: '0x1', moduleName: 'coin' })
      await client.move.module({ address: '0x1', moduleName: 'coin' }, { skipCache: true })

      expect(moveMock.spies.module).toHaveBeenCalledTimes(2)
    })

    it('should join inflight request even when skipCache is true', async () => {
      // skipCache should skip reading from cache, but should still join an inflight request
      const moveMock = createMockMoveService()
      const mockResult = { address: '0x1', name: 'coin' }
      moveMock.spies.module.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockResult), 50))
      )

      const mockClient = { move: moveMock.service } as unknown as InitiaClient
      const client = wrapClientWithCache(mockClient, 'test-chain')

      // Fire concurrent requests, second with skipCache
      const [r1, r2] = await Promise.all([
        client.move.module({ address: '0x1', moduleName: 'coin' }),
        client.move.module({ address: '0x1', moduleName: 'coin' }, { skipCache: true }),
      ])

      expect(r1).toEqual(mockResult)
      expect(r2).toEqual(mockResult)
      // Both should share the same inflight request
      expect(moveMock.spies.module).toHaveBeenCalledTimes(1)
    })

    it('should deduplicate concurrent requests', async () => {
      const moveMock = createMockMoveService()
      const mockResult = { address: '0x1', name: 'coin' }
      moveMock.spies.module.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockResult), 50))
      )

      const mockClient = { move: moveMock.service } as unknown as InitiaClient
      const client = wrapClientWithCache(mockClient, 'test-chain')

      // Fire 3 concurrent requests
      const [r1, r2, r3] = await Promise.all([
        client.move.module({ address: '0x1', moduleName: 'coin' }),
        client.move.module({ address: '0x1', moduleName: 'coin' }),
        client.move.module({ address: '0x1', moduleName: 'coin' }),
      ])

      expect(r1).toEqual(mockResult)
      expect(r2).toEqual(mockResult)
      expect(r3).toEqual(mockResult)
      // Only 1 gRPC call despite 3 requests
      expect(moveMock.spies.module).toHaveBeenCalledTimes(1)
    })

    it('should normalize Move address for cache key (case-insensitive)', async () => {
      const moveMock = createMockMoveService()
      const mockResult = { address: '0x1', name: 'coin' }
      moveMock.spies.module.mockResolvedValue(mockResult)

      const mockClient = { move: moveMock.service } as unknown as InitiaClient
      const client = wrapClientWithCache(mockClient, 'test-chain')

      // Different case, same address
      await client.move.module({ address: '0x1', moduleName: 'coin' })
      await client.move.module({ address: '0X1', moduleName: 'coin' })
      await client.move.module({
        address: '0x0000000000000000000000000000000000000000000000000000000000000001',
        moduleName: 'coin',
      })

      // All should hit same cache entry
      expect(moveMock.spies.module).toHaveBeenCalledTimes(1)
    })

    it('should not cache on error (no negative caching)', async () => {
      const moveMock = createMockMoveService()
      const error = new Error('Module not found')
      moveMock.spies.module
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({ address: '0x1', name: 'coin' })

      const mockClient = { move: moveMock.service } as unknown as InitiaClient
      const client = wrapClientWithCache(mockClient, 'test-chain')

      // First call fails
      await expect(client.move.module({ address: '0x1', moduleName: 'coin' })).rejects.toThrow(
        'Module not found'
      )

      // Second call should retry (not use cached error)
      const result = await client.move.module({ address: '0x1', moduleName: 'coin' })
      expect(result).toEqual({ address: '0x1', name: 'coin' })
      expect(moveMock.spies.module).toHaveBeenCalledTimes(2)
    })
  })

  describe('evm.contractAddrByDenom() caching', () => {
    it('should cache denom to contract address mapping', async () => {
      const evmMock = createMockEvmService()
      const mockResult = { address: '0x' + '1'.repeat(40) }
      evmMock.spies.contractAddrByDenom.mockResolvedValue(mockResult)

      const mockClient = { evm: evmMock.service } as unknown as MinievmClient
      const client = wrapClientWithCache(mockClient, 'test-chain')

      const result1 = await client.evm.contractAddrByDenom({ denom: 'uinit' })
      const result2 = await client.evm.contractAddrByDenom({ denom: 'uinit' })

      expect(result1.address).toBe(mockResult.address.toLowerCase())
      expect(result2.address).toBe(mockResult.address.toLowerCase())
      expect(evmMock.spies.contractAddrByDenom).toHaveBeenCalledTimes(1)
    })

    it('should NOT cache bidirectionally (each direction caches independently)', async () => {
      const evmMock = createMockEvmService()
      const contractAddr = '0x' + 'AB'.repeat(20)
      evmMock.spies.contractAddrByDenom.mockResolvedValue({ address: contractAddr })
      evmMock.spies.denom.mockResolvedValue({ denom: 'uinit' })

      const mockClient = { evm: evmMock.service } as unknown as MinievmClient
      const client = wrapClientWithCache(mockClient, 'test-chain')

      // Lookup by denom
      await client.evm.contractAddrByDenom({ denom: 'uinit' })

      // Reverse lookup should NOT use cache — requires its own gRPC call
      await client.evm.denom({ contractAddr: contractAddr.toLowerCase() })

      expect(evmMock.spies.contractAddrByDenom).toHaveBeenCalledTimes(1)
      expect(evmMock.spies.denom).toHaveBeenCalledTimes(1)
    })
  })

  describe('evm.denom() caching', () => {
    it('should cache contract to denom mapping', async () => {
      const evmMock = createMockEvmService()
      const mockResult = { denom: 'uinit' }
      evmMock.spies.denom.mockResolvedValue(mockResult)

      const mockClient = { evm: evmMock.service } as unknown as MinievmClient
      const client = wrapClientWithCache(mockClient, 'test-chain')

      const contractAddr = '0x' + '1'.repeat(40)
      const result1 = await client.evm.denom({ contractAddr })
      const result2 = await client.evm.denom({ contractAddr })

      expect(result1.denom).toBe('uinit')
      expect(result2.denom).toBe('uinit')
      expect(evmMock.spies.denom).toHaveBeenCalledTimes(1)
    })

    it('should normalize EVM address for cache key (case-insensitive)', async () => {
      const evmMock = createMockEvmService()
      const mockResult = { denom: 'uinit' }
      evmMock.spies.denom.mockResolvedValue(mockResult)

      const mockClient = { evm: evmMock.service } as unknown as MinievmClient
      const client = wrapClientWithCache(mockClient, 'test-chain')

      const addrLower = '0x' + 'ab'.repeat(20)
      const addrUpper = '0x' + 'AB'.repeat(20)
      const addrMixed = '0x' + 'Ab'.repeat(20)

      await client.evm.denom({ contractAddr: addrLower })
      await client.evm.denom({ contractAddr: addrUpper })
      await client.evm.denom({ contractAddr: addrMixed })

      // All should hit same cache entry
      expect(evmMock.spies.denom).toHaveBeenCalledTimes(1)
    })

    it('should NOT cache bidirectionally (each direction caches independently)', async () => {
      const evmMock = createMockEvmService()
      evmMock.spies.denom.mockResolvedValue({ denom: 'uinit' })
      evmMock.spies.contractAddrByDenom.mockResolvedValue({ address: '0x' + '1'.repeat(40) })

      const mockClient = { evm: evmMock.service } as unknown as MinievmClient
      const client = wrapClientWithCache(mockClient, 'test-chain')

      const contractAddr = '0x' + '1'.repeat(40)

      // Lookup by contract
      await client.evm.denom({ contractAddr })

      // Reverse lookup should NOT use cache — requires its own gRPC call
      await client.evm.contractAddrByDenom({ denom: 'uinit' })

      expect(evmMock.spies.denom).toHaveBeenCalledTimes(1)
      expect(evmMock.spies.contractAddrByDenom).toHaveBeenCalledTimes(1)
    })
  })

  describe('non-cached methods passthrough', () => {
    it('should pass through non-cached move methods unchanged', async () => {
      const moveMock = createMockMoveService()
      // Add a non-cached method
      const viewSpy = vi.fn().mockResolvedValue({ data: 'result' })
      ;(moveMock.service as any).view = viewSpy

      const mockClient = { move: moveMock.service } as unknown as InitiaClient
      const client = wrapClientWithCache(mockClient, 'test-chain')

      const result = await (client.move as any).view({ request: 'data' })

      expect(result).toEqual({ data: 'result' })
      expect(viewSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('generic service (height cache proxy)', () => {
    it('should delegate method calls to the original service', async () => {
      const balanceSpy = vi.fn().mockResolvedValue({ amount: '1000' })
      const mockClient = {
        bank: { balance: balanceSpy },
      } as unknown as InitiaClient
      const client = wrapClientWithCache(mockClient, 'test-chain')

      const result = await client.bank.balance({ address: 'init1...' })

      expect(result).toEqual({ amount: '1000' })
      expect(balanceSpy).toHaveBeenCalledTimes(1)
      expect(balanceSpy).toHaveBeenCalledWith({ address: 'init1...' }, undefined)
    })

    it('should pass options through to the original method', async () => {
      const balanceSpy = vi.fn().mockResolvedValue({ amount: '500' })
      const mockClient = {
        bank: { balance: balanceSpy },
      } as unknown as InitiaClient
      const client = wrapClientWithCache(mockClient, 'test-chain')

      const opts = { height: 100n }
      await client.bank.balance({ address: 'init1...' }, opts)

      expect(balanceSpy).toHaveBeenCalledWith({ address: 'init1...' }, opts)
    })

    it('should proxy non-function properties as-is', () => {
      const mockClient = {
        bank: { balance: vi.fn(), serviceName: 'bank-query' },
      } as unknown as InitiaClient
      const client = wrapClientWithCache(mockClient, 'test-chain')

      expect((client.bank as any).serviceName).toBe('bank-query')
    })
  })

  describe('client without move/evm services', () => {
    it('should handle client without move service', () => {
      const bankSpy = vi.fn()
      const mockClient = {
        bank: { balance: bankSpy },
      } as unknown as InitiaClient

      // Should not throw
      const client = wrapClientWithCache(mockClient, 'test-chain')
      expect(client.bank).toBeDefined()
    })

    it('should handle client without evm service', () => {
      const moveMock = createMockMoveService()
      const bankSpy = vi.fn()
      const mockClient = {
        move: moveMock.service,
        bank: { balance: bankSpy },
      } as unknown as InitiaClient

      // Should not throw
      const client = wrapClientWithCache(mockClient, 'test-chain')
      expect(client.move).toBeDefined()
      expect(client.bank).toBeDefined()
    })
  })

  describe('clearCache()', () => {
    it('should expose clearCache method', () => {
      const moveMock = createMockMoveService()
      const mockClient = { move: moveMock.service } as unknown as InitiaClient
      const client = wrapClientWithCache(mockClient, 'test-chain')

      expect(typeof client.clearCache).toBe('function')
    })

    it('should clear all cached data', async () => {
      const moveMock = createMockMoveService()
      const mockResult = { address: '0x1', name: 'coin' }
      moveMock.spies.module.mockResolvedValue(mockResult)

      const mockClient = { move: moveMock.service } as unknown as InitiaClient
      const client = wrapClientWithCache(mockClient, 'test-chain')

      // First call - caches result
      await client.move.module({ address: '0x1', moduleName: 'coin' })
      expect(moveMock.spies.module).toHaveBeenCalledTimes(1)

      // Clear cache
      client.clearCache()

      // Second call - should hit gRPC again
      await client.move.module({ address: '0x1', moduleName: 'coin' })
      expect(moveMock.spies.module).toHaveBeenCalledTimes(2)
    })

    it('should clear EVM cache', async () => {
      const evmMock = createMockEvmService()
      const contractAddr = '0x' + 'ab'.repeat(20)
      evmMock.spies.contractAddrByDenom.mockResolvedValue({ address: contractAddr })
      evmMock.spies.denom.mockResolvedValue({ denom: 'uinit' })

      const mockClient = { evm: evmMock.service } as unknown as MinievmClient
      const client = wrapClientWithCache(mockClient, 'test-chain')

      // Populate cache
      await client.evm.contractAddrByDenom({ denom: 'uinit' })

      // Clear cache
      client.clearCache()

      // Both directions should require fresh fetch
      await client.evm.denom({ contractAddr })
      expect(evmMock.spies.denom).toHaveBeenCalledTimes(1)
    })

    it('should be visible in Object.keys and has checks', () => {
      const moveMock = createMockMoveService()
      const mockClient = { move: moveMock.service } as unknown as InitiaClient
      const client = wrapClientWithCache(mockClient, 'test-chain')

      expect('clearCache' in client).toBe(true)
      expect(Object.keys(client)).toContain('clearCache')
    })
  })
})
