/**
 * Wallet → ChainContext integration tests.
 *
 * Covers #25 (6-3): Verify that Wallet.chain() correctly passes signer
 * to ChainContext, and signing works through the integrated path.
 *
 * Uses ctx.sign() instead of ctx.signAndBroadcast() to avoid gRPC mocking.
 */

import { describe, it, expect } from 'vitest'
import { Wallet } from '../../../src/wallet/wallet'
import { buildChainContextFactory } from '../../../src/wallet/chain-context'
import { RawKey } from '../../../src/key/raw-key'
import { Message } from '../../../src/msgs/types'
import { MsgSendSchema } from '@initia/initia-proto/cosmos/bank/v1beta1/tx_pb'
import type { UnsignedTx } from '../../../src/client/types'
import type { DirectSigner, DirectSignDoc } from '../../../src/signer/types'
import type { Transport } from '@connectrpc/connect'
import type { ChainInfoProvider, ChainInfo } from '../../../src/provider/types'

// ============= Fixtures =============

const mockTransport = {} as Transport
const createChainContext = buildChainContextFactory(
  () => mockTransport,
  () => ({}),
  () => ({}) as never
)

const testKey = RawKey.fromHex('0000000000000000000000000000000000000000000000000000000000000001')

const otherKey = RawKey.fromHex('0000000000000000000000000000000000000000000000000000000000000002')

const mockChainInfo: ChainInfo = {
  chainId: 'test-1',
  chainName: 'Test Chain',
  chainType: 'initia' as const,
  network: 'testnet' as const,
  bech32Prefix: 'init',
}

const mockProvider: ChainInfoProvider = {
  getChainInfo: (_chainId: string) => mockChainInfo as any,
  listChains: () => [mockChainInfo],
  hasChain: (_chainId: string) => true,
}

function createUnsignedTx(fromAddress: string): UnsignedTx {
  return {
    msgs: [
      new Message(MsgSendSchema, {
        fromAddress,
        toAddress: 'init1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq5qnc04y',
        amount: [{ denom: 'uinit', amount: '1000000' }],
      }),
    ],
    signMode: 'direct',
    chainId: 'test-1',
    accountNumber: 1n,
    sequence: 0n,
    fee: [{ denom: 'uinit', amount: '1000' }],
    gasLimit: 200000n,
    memo: '',
  }
}

function createMockDirectSigner(): DirectSigner {
  const pubKey = testKey.publicKey
  return {
    algorithm: 'eth_secp256k1',
    getPublicKey: async () => pubKey,
    getAddress: async () => testKey.address,
    sign: async () => new Uint8Array(64),
    signDirect: async (_addr: string, signDoc: DirectSignDoc) => ({
      signed: signDoc,
      signature: {
        pubKey: {
          typeUrl: '/cosmos.crypto.secp256k1.PubKey',
          value: pubKey,
        },
        signature: new Uint8Array(64),
      },
    }),
  }
}

// ============= Tests =============

describe('Wallet → ChainContext integration (#25 / 6-3)', () => {
  it('Wallet({ key }) → chain() → sign(): Key basic path', async () => {
    const wallet = new Wallet(createChainContext, {
      key: testKey,
      provider: mockProvider,
    })

    const ctx = wallet.chain('test-1')
    const tx = createUnsignedTx(testKey.address)
    const signed = await ctx.sign(tx)

    expect(signed.txBytes).toBeInstanceOf(Uint8Array)
    expect(signed.txBytes.length).toBeGreaterThan(0)
  })

  it('Wallet() → chain({ signer }) → sign(): external signer path', async () => {
    const wallet = new Wallet(createChainContext, {
      provider: mockProvider,
    })
    const signer = createMockDirectSigner()

    const ctx = wallet.chain('test-1', { signer })
    const tx = createUnsignedTx(testKey.address)
    const signed = await ctx.sign(tx)

    expect(signed.txBytes).toBeInstanceOf(Uint8Array)
    expect(signed.txBytes.length).toBeGreaterThan(0)
  })

  it('Wallet({ key }) → chain({ signer: otherKey }) → sign(): Signer override at chain level', async () => {
    const wallet = new Wallet(createChainContext, {
      key: testKey,
      provider: mockProvider,
    })

    const ctx = wallet.chain('test-1', { signer: otherKey })
    const tx = createUnsignedTx(otherKey.address)
    const signed = await ctx.sign(tx)

    expect(signed.txBytes).toBeInstanceOf(Uint8Array)
    expect(signed.txBytes.length).toBeGreaterThan(0)

    // Verify otherKey was used, not testKey — different addresses produce different txBytes
    const ctxOriginal = wallet.chain('test-1')
    const signedOriginal = await ctxOriginal.sign(createUnsignedTx(testKey.address))
    expect(signed.txBytes).not.toEqual(signedOriginal.txBytes)
  })

  it('ctx.sign(tx, { signer }) → per-operation signer override', async () => {
    const wallet = new Wallet(createChainContext, {
      key: testKey,
      provider: mockProvider,
    })

    const ctx = wallet.chain('test-1')
    const signer = createMockDirectSigner()

    // Sign with per-operation signer override
    const tx = createUnsignedTx(testKey.address)
    const signedWithOverride = await ctx.sign(tx, { signer })

    expect(signedWithOverride.txBytes).toBeInstanceOf(Uint8Array)
    expect(signedWithOverride.txBytes.length).toBeGreaterThan(0)

    // Should differ from Key-based signing (mock signer returns zero-filled signature)
    const signedWithKey = await ctx.sign(createUnsignedTx(testKey.address))
    expect(signedWithOverride.txBytes).not.toEqual(signedWithKey.txBytes)
  })

  it('watch-only ctx.sign() should throw', async () => {
    const wallet = new Wallet(createChainContext, {
      provider: mockProvider,
    })

    const ctx = wallet.chain('test-1', { address: 'init1watchonly...' })
    const tx = createUnsignedTx('init1watchonly...')

    await expect(ctx.sign(tx)).rejects.toThrow('Cannot sign')
  })
})
