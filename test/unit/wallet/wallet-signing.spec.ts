/**
 * Wallet amino/eip191 signing tests.
 *
 * Covers #120: Wallet.createAndSignTx() amino/eip191 paths.
 *
 * Wallet.sign() and createAndSignTx() are Key-only (no external signer).
 * External signer signing goes through ChainContext.sign() instead.
 */

import { describe, it, expect } from 'vitest'
import { Wallet } from '../../../src/wallet/wallet'
import { RawKey } from '../../../src/key/raw-key'
import { Message } from '../../../src/msgs/types'
import { MsgSendSchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/bank/v1beta1/tx_pb'
import type { CreateTxOptions, WalletSignOptions } from '../../../src/wallet/wallet'

// Deterministic test key
const testKey = RawKey.fromHex('0000000000000000000000000000000000000000000000000000000000000001')

// Minimal createChainContext stub (not used by createAndSignTx)
const stubCreateChainContext = (() => {
  throw new Error('createChainContext should not be called in these tests')
}) as any

const signOptions: WalletSignOptions = {
  chainId: 'test-1',
  accountNumber: 1n,
  sequence: 0n,
}

function createTestTxOptions(signMode?: 'direct' | 'amino' | 'eip191'): CreateTxOptions {
  return {
    msgs: [
      new Message(MsgSendSchema, {
        fromAddress: testKey.address,
        toAddress: 'init1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq5qnc04y',
        amount: [{ denom: 'uinit', amount: '1000000' }],
      }),
    ],
    fee: [{ denom: 'uinit', amount: '1000' }],
    gasLimit: 200000n,
    memo: '',
    signMode,
  }
}

describe('Wallet.createAndSignTx() signing modes (#120)', () => {
  const wallet = new Wallet(stubCreateChainContext, { key: testKey })

  describe('direct signing (baseline)', () => {
    it('should produce valid SignedTx', async () => {
      const result = await wallet.createAndSignTx(createTestTxOptions('direct'), signOptions)

      expect(result.txBytes).toBeInstanceOf(Uint8Array)
      expect(result.txBytes.length).toBeGreaterThan(0)
      expect(result.bodyBytes).toBeInstanceOf(Uint8Array)
      expect(result.authInfoBytes).toBeInstanceOf(Uint8Array)
      expect(result.signature).toBeInstanceOf(Uint8Array)
      expect(result.signature.length).toBe(64)
    })
  })

  describe('amino signing', () => {
    it('should produce valid SignedTx', async () => {
      const result = await wallet.createAndSignTx(createTestTxOptions('amino'), signOptions)

      expect(result.txBytes).toBeInstanceOf(Uint8Array)
      expect(result.txBytes.length).toBeGreaterThan(0)
      expect(result.signature).toBeInstanceOf(Uint8Array)
      expect(result.signature.length).toBe(64)
    })

    it('should produce different signature from direct mode', async () => {
      const directResult = await wallet.createAndSignTx(createTestTxOptions('direct'), signOptions)
      const aminoResult = await wallet.createAndSignTx(createTestTxOptions('amino'), signOptions)

      // Different signing modes produce different signatures
      expect(directResult.signature).not.toEqual(aminoResult.signature)
    })
  })

  describe('eip191 signing', () => {
    it('should produce valid SignedTx', async () => {
      const result = await wallet.createAndSignTx(createTestTxOptions('eip191'), signOptions)

      expect(result.txBytes).toBeInstanceOf(Uint8Array)
      expect(result.txBytes.length).toBeGreaterThan(0)
      expect(result.signature).toBeInstanceOf(Uint8Array)
      expect(result.signature.length).toBe(64)
    })

    it('should produce different signature from amino mode', async () => {
      const aminoResult = await wallet.createAndSignTx(createTestTxOptions('amino'), signOptions)
      const eip191Result = await wallet.createAndSignTx(createTestTxOptions('eip191'), signOptions)

      // eip191 uses keccak256, amino uses sha256
      expect(aminoResult.signature).not.toEqual(eip191Result.signature)
    })
  })

  describe('default signMode', () => {
    it('should default to direct when signMode is not specified', async () => {
      const defaultResult = await wallet.createAndSignTx(
        createTestTxOptions(), // no signMode
        signOptions
      )
      const directResult = await wallet.createAndSignTx(createTestTxOptions('direct'), signOptions)

      // Default should be identical to explicit direct
      expect(defaultResult.txBytes).toEqual(directResult.txBytes)
    })
  })

  describe('error cases', () => {
    it('should throw when wallet has no key', async () => {
      const walletNoKey = new Wallet(stubCreateChainContext)

      await expect(
        walletNoKey.createAndSignTx(createTestTxOptions('direct'), signOptions)
      ).rejects.toThrow('No signing key available')
    })
  })
})
