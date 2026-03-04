/**
 * Unit tests for Bridge — Router integration.
 *
 * Tests:
 * - Router unavailable: all router methods throw InitiaError
 * - Router available: methods delegate to RouterClient (via fetch mock)
 * - signOpHook: signs hook data and returns SignedOpHook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Bridge } from '../../../src/bridge/bridge'
import { InitiaError } from '../../../src/errors'
import type { ChainInfo, ChainInfoProvider } from '../../../src/provider/types'
import type { Signer } from '../../../src/signer/types'

const ROUTER_URL = 'https://router.test.initia.xyz'

function createMockProvider(chains: ChainInfo[]): ChainInfoProvider {
  const map = new Map(chains.map(c => [c.chainId, c]))
  return {
    getChainInfo: (id: string) => map.get(id) as any,
    listChains: () => chains,
    hasChain: (id: string) => map.has(id),
  }
}

const l1Chain: ChainInfo = {
  chainId: 'initiation-2',
  chainName: 'Initia Testnet',
  chainType: 'initia',
  network: 'testnet',
}

const provider = createMockProvider([l1Chain])

// =============================================================================
// Router unavailable
// =============================================================================

describe('Bridge: router unavailable', () => {
  const bridge = new Bridge(provider) // no routerUrl

  it('route() should throw InitiaError', () => {
    expect(() =>
      bridge.route({
        amount: '1',
        source: { chainId: 'a', denom: 'b' },
        dest: { chainId: 'c', denom: 'd' },
      })
    ).toThrow(InitiaError)
  })

  it('buildTransferMsgs() should throw InitiaError', () => {
    expect(() => bridge.buildTransferMsgs({ route: {} as any, addresses: [] })).toThrow(InitiaError)
  })

  it('getOpHook() should throw InitiaError', () => {
    expect(() =>
      bridge.getOpHook({
        sourceAddress: 'a',
        sourceChainId: 'b',
        sourceDenom: 'c',
        destAddress: 'd',
        destChainId: 'e',
        destDenom: 'f',
      })
    ).toThrow(InitiaError)
  })

  it('trackTransfer() should throw InitiaError', () => {
    expect(() => bridge.trackTransfer('0x1', 'chain-1')).toThrow(InitiaError)
  })

  it('getTransferStatus() should throw InitiaError', () => {
    expect(() => bridge.getTransferStatus('0x1', 'chain-1')).toThrow(InitiaError)
  })

  it('error message should indicate router unavailability', () => {
    expect(() =>
      bridge.route({
        amount: '1',
        source: { chainId: 'a', denom: 'b' },
        dest: { chainId: 'c', denom: 'd' },
      })
    ).toThrow('Router API not available')
  })
})

// =============================================================================
// Router available — delegates to RouterClient
// =============================================================================

describe('Bridge: router available', () => {
  let bridge: Bridge
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
    bridge = new Bridge(provider, ROUTER_URL)
  })

  it('route() should call RouterClient.route()', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          amount_in: '100',
          amount_out: '99',
          source_asset_chain_id: 'a',
          source_asset_denom: 'b',
          dest_asset_chain_id: 'c',
          dest_asset_denom: 'd',
          operations: [],
        }),
    })

    const route = await bridge.route({
      amount: '100',
      source: { chainId: 'a', denom: 'b' },
      dest: { chainId: 'c', denom: 'd' },
    })

    expect(route.amountIn).toBe('100')
    expect(mockFetch).toHaveBeenCalledOnce()
    expect(mockFetch.mock.calls[0][0]).toContain('/v2/fungible/route')
  })

  it('buildTransferMsgs() should call RouterClient.msgs()', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ txs: [] }),
    })

    const txs = await bridge.buildTransferMsgs({
      route: { _raw: { operations: [] } } as any,
      addresses: ['init1abc'],
    })

    expect(txs).toEqual([])
    expect(mockFetch.mock.calls[0][0]).toContain('/v2/fungible/msgs')
  })

  it('trackTransfer() should call RouterClient.track()', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })

    await bridge.trackTransfer('0xabc', 'chain-1')

    expect(mockFetch.mock.calls[0][0]).toContain('/v2/tx/track')
  })

  it('getTransferStatus() should call RouterClient.status()', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ status: 'complete', tx_hash: '0xabc' }),
    })

    const status = await bridge.getTransferStatus('0xabc', 'chain-1')

    expect(status.status).toBe('complete')
    expect(mockFetch.mock.calls[0][0]).toContain('/v2/tx/status')
  })
})

// =============================================================================
// signOpHook
// =============================================================================

describe('Bridge: signOpHook', () => {
  let bridge: Bridge

  beforeEach(() => {
    bridge = new Bridge(provider, ROUTER_URL)
  })

  function createMockSigner(address: string, signResult: Uint8Array): Signer {
    return {
      algorithm: 'secp256k1',
      getPublicKey: () => Promise.resolve(new Uint8Array(33)),
      getAddress: () => Promise.resolve(address),
      sign: () => Promise.resolve(signResult),
    }
  }

  it('should return SignedOpHook with base64-encoded signature and address', async () => {
    const signer = createMockSigner('init1signer', new Uint8Array([1, 2, 3, 4]))

    const result = await bridge.signOpHook({ chainId: 'evm-1', hook: ['data1', 'data2'] }, signer)

    expect(result.signer).toBe('init1signer')
    // base64 of [1,2,3,4] = "AQIDBA=="
    expect(result.hook).toBe('AQIDBA==')
  })

  it('should join hook array before signing', async () => {
    const signSpy = vi.fn().mockResolvedValue(new Uint8Array([0]))
    const signer: Signer = {
      algorithm: 'secp256k1',
      getPublicKey: () => Promise.resolve(new Uint8Array(33)),
      getAddress: () => Promise.resolve('init1test'),
      sign: signSpy,
    }

    await bridge.signOpHook({ chainId: 'evm-1', hook: ['abc', 'def'] }, signer)

    // sign() should receive UTF-8 bytes of joined hook strings
    const signedBytes = signSpy.mock.calls[0][0] as Uint8Array
    const decoded = new TextDecoder().decode(signedBytes)
    expect(decoded).toBe('abcdef')
  })

  it('should work without routerUrl (signOpHook does not require router)', async () => {
    const bridgeNoRouter = new Bridge(provider) // no routerUrl
    const signer = createMockSigner('init1addr', new Uint8Array([5, 6]))

    const result = await bridgeNoRouter.signOpHook({ chainId: 'evm-1', hook: ['test'] }, signer)

    expect(result.signer).toBe('init1addr')
    expect(result.hook).toBe('BQY=') // base64 of [5,6]
  })
})
