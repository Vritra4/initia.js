/**
 * Integration tests for Provider-based transactions.
 *
 * Validates real transaction submission on Initia Testnet (initiation-2)
 * using Wallet + ChainContext + RegistryProvider.
 *
 * Requires a funded mnemonic:
 *   TEST_MNEMONIC="your mnemonic here" npm test -- --run test/integration/provider-tx.spec.ts
 *
 * Skip with: SKIP_INTEGRATION_TESTS=true npm test
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { ConnectError, Code } from '@connectrpc/connect'
import { createRegistryProvider, type RegistryProvider } from '../../src/provider/registry-provider'
import { Wallet } from '../../src/wallet/wallet'
import { createChainContext } from '../../src/entry.node'
import { MnemonicKey } from '../../src/key/mnemonic-key'
import { coin } from '../../src/core/coin'

const SKIP = process.env.SKIP_INTEGRATION_TESTS === 'true'
const TEST_MNEMONIC = process.env.TEST_MNEMONIC

// =============================================================================
// 1. Read-only wallet queries (no funded mnemonic needed)
// =============================================================================

describe.skipIf(SKIP || !TEST_MNEMONIC)('Provider Wallet Queries (Initia Testnet)', () => {
  let provider: RegistryProvider
  let wallet: Wallet

  beforeAll(async () => {
    provider = await createRegistryProvider({ network: 'testnet' })
    const key = new MnemonicKey({ mnemonic: TEST_MNEMONIC! })
    wallet = new Wallet(createChainContext, { key, provider })
  }, 30000)

  describe('wallet basics', () => {
    it('should derive address from mnemonic', () => {
      expect(wallet.address).toBeDefined()
      expect(wallet.address).toMatch(/^init1/)
    })

    it('should get chain context for initiation-2', () => {
      const ctx = wallet.chain('initiation-2')
      expect(ctx.chainId).toBe('initiation-2')
      expect(ctx.chainType).toBe('initia')
    })

    it('should query balance (may be zero)', async () => {
      const ctx = wallet.chain('initiation-2')
      const balances = await ctx.getBalance()
      expect(Array.isArray(balances)).toBe(true)
    }, 30000)

    it('should query account info (may not exist)', async () => {
      const ctx = wallet.chain('initiation-2')
      try {
        const account = await ctx.getAccount()
        expect(account).toBeDefined()
      } catch (error) {
        // Only "not found" is expected for unfunded test mnemonic
        expect(error).toBeInstanceOf(ConnectError)
        expect((error as ConnectError).code).toBe(Code.NotFound)
      }
    }, 30000)
  })

  describe('message creation', () => {
    it('should create a MsgSend via ctx.msgs.send', () => {
      const ctx = wallet.chain('initiation-2')
      const msg = ctx.msgs.send(wallet.address!, wallet.address!, coin('uinit', '1000'))
      expect(msg.toAny().typeUrl).toContain('MsgSend')
      expect(msg.toAny().value).toBeInstanceOf(Uint8Array)
      expect(msg.toAny().value.length).toBeGreaterThan(0)
    })

    it('should create an IBC transfer message', () => {
      const ctx = wallet.chain('initiation-2')
      const msg = ctx.msgs.transfer(
        wallet.address!,
        wallet.address!,
        coin('uinit', '1000'),
        'channel-0'
      )
      expect(msg.toAny().typeUrl).toContain('MsgTransfer')
      expect(msg.toAny().value.length).toBeGreaterThan(0)
    })
  })
})

// =============================================================================
// 2. Transaction submission (requires funded mnemonic)
// =============================================================================

describe.skipIf(SKIP || !TEST_MNEMONIC)('Provider TX Tests (Initia Testnet)', () => {
  let provider: RegistryProvider
  let wallet: Wallet
  // Reuse a single ChainContext across all TX tests so the local sequence
  // counter (_nextSequence) is shared — prevents sequence mismatch when the
  // node hasn't indexed a recently confirmed TX yet.
  let ctx: ReturnType<Wallet['chain']>

  beforeAll(async () => {
    provider = await createRegistryProvider({ network: 'testnet' })
    const key = new MnemonicKey({ mnemonic: TEST_MNEMONIC! })
    wallet = new Wallet(createChainContext, { key, provider })
    ctx = wallet.chain('initiation-2')
  }, 30000)

  it('should have balance for tx fees', async () => {
    const balances = await ctx.getBalance()
    const uinit = balances.find(b => b.denom === 'uinit')
    expect(uinit).toBeDefined()
    expect(BigInt(uinit!.amount)).toBeGreaterThan(0n)
  }, 30000)

  it('should send uinit to self (direct mode)', async () => {
    const msg = ctx.msgs.send(wallet.address!, wallet.address!, coin('uinit', '1'))

    const result = await ctx.signAndBroadcast([msg], {
      fee: [{ denom: 'uinit', amount: '10000' }],
      signMode: 'direct',
    })
    expect(result.txHash).toBeDefined()
    expect(typeof result.txHash).toBe('string')
    expect(result.txHash.length).toBeGreaterThan(0)

    const confirmed = await result.waitForConfirmation()
    expect(confirmed.code).toBe(0)
    expect(confirmed.height).toBeGreaterThan(0n)
  }, 120000)

  it('should send uinit to self (amino mode)', async () => {
    const msg = ctx.msgs.send(wallet.address!, wallet.address!, coin('uinit', '1'))

    const result = await ctx.signAndBroadcast([msg], {
      fee: [{ denom: 'uinit', amount: '10000' }],
      signMode: 'amino',
    })
    expect(result.txHash).toBeDefined()
    expect(typeof result.txHash).toBe('string')
    expect(result.txHash.length).toBeGreaterThan(0)

    const confirmed = await result.waitForConfirmation()
    expect(confirmed.code).toBe(0)
    expect(confirmed.height).toBeGreaterThan(0n)
  }, 120000)

  it('should send uinit to self (eip191 mode)', async () => {
    const msg = ctx.msgs.send(wallet.address!, wallet.address!, coin('uinit', '1'))

    const result = await ctx.signAndBroadcast([msg], {
      fee: [{ denom: 'uinit', amount: '10000' }],
      signMode: 'eip191',
    })
    expect(result.txHash).toBeDefined()
    expect(typeof result.txHash).toBe('string')
    expect(result.txHash.length).toBeGreaterThan(0)

    const confirmed = await result.waitForConfirmation()
    expect(confirmed.code).toBe(0)
    expect(confirmed.height).toBeGreaterThan(0n)
  }, 120000)

  it('should estimate gas before sending', async () => {
    const msg = ctx.msgs.send(wallet.address!, wallet.address!, coin('uinit', '1'))

    const gas = await ctx.estimateGas([msg])
    expect(gas.gasLimit).toBeTypeOf('bigint')
    expect(gas.gasLimit).toBeGreaterThan(0n)
    expect(gas.fee).toBeDefined()
    expect(gas.fee.length).toBeGreaterThan(0)
  }, 30000)
})
