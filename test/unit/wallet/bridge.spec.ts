/**
 * Unit tests for WalletBridge — wallet.bridge accessor.
 *
 * Tests the core value of WalletBridge: automatic chain routing
 * (deposit/claim on L1, withdraw on L2) and sender address derivation.
 *
 * Delegation correctness (e.g., getBridgeId, listBridgeableChains)
 * is tested in OpBridge.spec.ts, not duplicated here.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WalletBridge } from '../../../src/wallet/bridge'
import { Wallet } from '../../../src/wallet/wallet'
import { Coin } from '../../../src/core/coin'
import type { ChainInfo, ChainInfoProvider } from '../../../src/provider/types'
import type { ChainContext, BroadcastResultWithWait } from '../../../src/wallet/chain-context'
import type { ChainType } from '../../../src/client/types'
import type { WithdrawalInfo } from '../../../src/bridge/types'

// Hoist mock methods so they're accessible in vi.mock factory and tests
const { mockOpBridge } = vi.hoisted(() => ({
  mockOpBridge: {
    deposit: vi.fn(() => ({ typeUrl: '/opinit.ophost.v1.MsgInitiateTokenDeposit' })),
    withdraw: vi.fn(() => ({ typeUrl: '/opinit.opchild.v1.MsgInitiateTokenWithdrawal' })),
    claim: vi.fn(() => ({ typeUrl: '/opinit.ophost.v1.MsgFinalizeTokenWithdrawal' })),
    getBridgeId: vi.fn(() => 3n),
    listBridgeableChains: vi.fn(),
    getWithdrawals: vi.fn(() => Promise.resolve([])),
    getWithdrawalStatus: vi.fn(),
  },
}))

// Mock Bridge as a class that returns our mock instance
vi.mock('../../../src/bridge/bridge', () => ({
  Bridge: class {
    deposit = mockOpBridge.deposit
    withdraw = mockOpBridge.withdraw
    claim = mockOpBridge.claim
    getBridgeId = mockOpBridge.getBridgeId
    listBridgeableChains = mockOpBridge.listBridgeableChains
    getWithdrawals = mockOpBridge.getWithdrawals
    getWithdrawalStatus = mockOpBridge.getWithdrawalStatus
  },
}))

const l1Chain: ChainInfo = {
  chainId: 'initiation-2',
  chainName: 'Initia Testnet',
  chainType: 'initia',
  network: 'testnet',
  bech32Prefix: 'init',
}

const l2Chain: ChainInfo = {
  chainId: 'minimove-1',
  chainName: 'Minimove Testnet',
  chainType: 'minimove',
  network: 'testnet',
  opBridgeId: 3n,
  executorUri: 'https://executor.test.example.com',
  bech32Prefix: 'init',
}

function createMockProvider(chains: ChainInfo[]): ChainInfoProvider {
  const map = new Map(chains.map(c => [c.chainId, c]))
  return {
    getChainInfo: (id: string) => map.get(id) as any,
    listChains: () => chains,
    hasChain: (id: string) => map.has(id),
    createTransport: (() => ({})) as any,
  }
}

function createMockBroadcastResult(): BroadcastResultWithWait {
  return {
    txHash: 'ABCDEF1234567890',
    rawLog: '',
    gasUsed: 100000n,
    waitForConfirmation: vi.fn(() =>
      Promise.resolve({
        txHash: 'ABCDEF1234567890',
        height: 100n,
        code: 0,
        rawLog: '',
        events: [],
        gasUsed: 100000n,
        gasWanted: 200000n,
      })
    ),
  }
}

describe('WalletBridge', () => {
  let mockChainContext: ChainContext
  let mockGetChainContext: (chainId: string) => ChainContext<ChainType>
  let mockGetAddress: (chainId: string) => string
  let provider: ChainInfoProvider

  beforeEach(() => {
    vi.clearAllMocks()

    mockOpBridge.listBridgeableChains.mockReturnValue([l2Chain])

    const broadcastResult = createMockBroadcastResult()

    mockChainContext = {
      signAndBroadcast: vi.fn(() => Promise.resolve(broadcastResult)),
    } as unknown as ChainContext

    mockGetChainContext = vi.fn((_chainId: string): ChainContext<ChainType> => mockChainContext)
    mockGetAddress = vi.fn((chainId: string) => `init1wallet_${chainId}`)
    provider = createMockProvider([l1Chain, l2Chain])
  })

  describe('chain routing', () => {
    it('deposit should sign and broadcast on L1 (not L2)', async () => {
      const bridge = new WalletBridge(mockGetChainContext, mockGetAddress, provider)
      await bridge.deposit('minimove-1', '1000000uinit')

      expect(mockGetChainContext).toHaveBeenCalledWith('initiation-2')
      expect(mockGetAddress).toHaveBeenCalledWith('initiation-2')
      expect(mockChainContext.signAndBroadcast).toHaveBeenCalledOnce()
    })

    it('withdraw should sign and broadcast on L2 (not L1)', async () => {
      const bridge = new WalletBridge(mockGetChainContext, mockGetAddress, provider)
      await bridge.withdraw('minimove-1', '1000000umin')

      expect(mockGetChainContext).toHaveBeenCalledWith('minimove-1')
      expect(mockGetAddress).toHaveBeenCalledWith('minimove-1')
      expect(mockChainContext.signAndBroadcast).toHaveBeenCalledOnce()
    })

    it('claim should sign and broadcast on L1 (not L2)', async () => {
      const bridge = new WalletBridge(mockGetChainContext, mockGetAddress, provider)

      const withdrawal: WithdrawalInfo = {
        sequence: 42n,
        from: 'init1sender',
        to: 'init1receiver',
        amount: new Coin('uinit', '1000000'),
        outputIndex: 5n,
        bridgeId: 3n,
        txHash: 'abc123',
        status: { status: 'claimable' },
        withdrawalProofs: ['deadbeef'],
        version: '01',
        storageRoot: 'aabb',
        lastBlockHash: 'ccdd',
      }

      await bridge.claim(withdrawal)

      expect(mockGetChainContext).toHaveBeenCalledWith('initiation-2')
      expect(mockGetAddress).toHaveBeenCalledWith('initiation-2')
      // Sender is auto-derived from wallet key on L1
      expect(mockOpBridge.claim).toHaveBeenCalledWith({
        sender: 'init1wallet_initiation-2',
        withdrawal,
      })
    })
  })

  describe('address derivation', () => {
    it('getWithdrawals should auto-derive L2 address for query', async () => {
      const bridge = new WalletBridge(mockGetChainContext, mockGetAddress, provider)
      await bridge.getWithdrawals('minimove-1')

      expect(mockGetAddress).toHaveBeenCalledWith('minimove-1')
      expect(mockOpBridge.getWithdrawals).toHaveBeenCalledWith(
        'minimove-1',
        'init1wallet_minimove-1',
        undefined
      )
    })
  })

  describe('error handling', () => {
    it('should throw if L1 chain not in provider (deposit)', async () => {
      const noL1Provider = createMockProvider([l2Chain])
      const bridge = new WalletBridge(mockGetChainContext, mockGetAddress, noL1Provider)

      await expect(bridge.deposit('minimove-1', '1000000uinit')).rejects.toThrow(
        'L1 (initia) chain not found'
      )
    })

    it('should throw if L1 chain not in provider (claim)', async () => {
      const noL1Provider = createMockProvider([l2Chain])
      const bridge = new WalletBridge(mockGetChainContext, mockGetAddress, noL1Provider)

      const withdrawal: WithdrawalInfo = {
        sequence: 1n,
        from: 'init1sender',
        to: 'init1receiver',
        amount: new Coin('uinit', '1000'),
        outputIndex: 1n,
        bridgeId: 3n,
        txHash: 'abc',
        status: { status: 'claimable' },
        withdrawalProofs: [],
        version: '',
        storageRoot: '',
        lastBlockHash: '',
      }

      await expect(bridge.claim(withdrawal)).rejects.toThrow('L1 (initia) chain not found')
    })
  })
})

describe('Wallet.bridge accessor', () => {
  const mockCreateChainContext = vi.fn() as any

  beforeEach(() => {
    vi.clearAllMocks()
    mockOpBridge.listBridgeableChains.mockReturnValue([l2Chain])
  })

  it('should return WalletBridge instance', () => {
    const provider = createMockProvider([l1Chain, l2Chain])
    const wallet = new Wallet(mockCreateChainContext, { provider })

    expect(wallet.bridge).toBeInstanceOf(WalletBridge)
  })

  it('should return same instance on repeated access (lazy singleton)', () => {
    const provider = createMockProvider([l1Chain, l2Chain])
    const wallet = new Wallet(mockCreateChainContext, { provider })

    const bridge1 = wallet.bridge
    const bridge2 = wallet.bridge
    expect(bridge1).toBe(bridge2)
  })

  it('should throw if provider is not set', () => {
    const wallet = new Wallet(mockCreateChainContext)
    expect(() => wallet.bridge).toThrow('Provider is required')
  })
})
