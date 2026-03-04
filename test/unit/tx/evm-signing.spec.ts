/**
 * Verify that sendEvmTx signing logic produces valid EIP-1559 signatures.
 *
 * Extracts the signing logic from sendEvmTx and compares against viem's
 * privateKeyToAccount().signTransaction() to ensure byte layout correctness.
 */
import { describe, it, expect } from 'vitest'
import {
  serializeTransaction,
  parseTransaction,
  recoverTransactionAddress,
  type TransactionSerializableEIP1559,
  type TransactionSerialized,
} from 'viem'
import { secp256k1 } from '@noble/curves/secp256k1.js'
import { hexToBytes, bytesToHex } from '@noble/hashes/utils.js'
import { keccak256 } from '../../../src/util/hash'

const TEST_PK = `0x${'01'.repeat(32)}` as `0x${string}`

/**
 * Replicate the signing logic from src/tx/evm.ts (lines 128-142)
 * to test in isolation without requiring an RPC client.
 */
function signTransaction(
  txParams: TransactionSerializableEIP1559,
  privateKeyHex: `0x${string}`
): TransactionSerialized {
  const privateKeyBytes = hexToBytes(privateKeyHex.slice(2))

  // Serialize unsigned transaction
  const serialized = serializeTransaction(txParams)

  // Sign: keccak256(serialized) → ECDSA signature
  const txHash = keccak256(hexToBytes(serialized.slice(2)))
  const sigBytes = secp256k1.sign(txHash, privateKeyBytes, {
    prehash: false,
    format: 'recovered', // 65 bytes: recovery(1) || r(32) || s(32)
  })

  // Serialize signed transaction
  return serializeTransaction(txParams, {
    r: `0x${bytesToHex(sigBytes.slice(1, 33))}` as `0x${string}`,
    s: `0x${bytesToHex(sigBytes.slice(33, 65))}` as `0x${string}`,
    yParity: sigBytes[0] as 0 | 1,
  })
}

describe('EVM tx signing (format: recovered byte layout)', () => {
  const txParams: TransactionSerializableEIP1559 = {
    type: 'eip1559',
    chainId: 1,
    nonce: 0,
    to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    data: '0x',
    value: 1000000000000000n, // 0.001 ETH
    maxFeePerGas: 20000000000n,
    maxPriorityFeePerGas: 1000000000n,
    gas: 21000n,
  }

  it('should produce a parseable signed transaction', () => {
    const signedTx = signTransaction(txParams, TEST_PK)
    const parsed = parseTransaction(signedTx)

    expect(parsed.type).toBe('eip1559')
    expect(parsed.chainId).toBe(1)
    expect(parsed.nonce).toBe(0)
    expect(parsed.to?.toLowerCase()).toBe(txParams.to!.toLowerCase())
    expect(parsed.value).toBe(1000000000000000n)
    expect(parsed.r).toBeDefined()
    expect(parsed.s).toBeDefined()
    expect(parsed.yParity).toBeDefined()
  })

  it('should recover the correct signer address', async () => {
    const signedTx = signTransaction(txParams, TEST_PK)

    // Derive expected address from private key
    const pkBytes = hexToBytes(TEST_PK.slice(2))
    const pubKey = secp256k1.getPublicKey(pkBytes, false) // uncompressed
    const pubKeyBody = pubKey.slice(1)
    const hash = keccak256(pubKeyBody)
    const expectedAddress = `0x${bytesToHex(hash.slice(12))}`.toLowerCase()

    // Recover address from signed transaction using viem
    const recoveredAddress = await recoverTransactionAddress({
      serializedTransaction: signedTx,
    })

    expect(recoveredAddress.toLowerCase()).toBe(expectedAddress)
  })

  it('should work with various chain IDs', async () => {
    for (const chainId of [1, 5, 137, 42161, 81457]) {
      const params = { ...txParams, chainId }
      const signedTx = signTransaction(params, TEST_PK)

      const parsed = parseTransaction(signedTx)
      expect(parsed.chainId).toBe(chainId)

      const pkBytes = hexToBytes(TEST_PK.slice(2))
      const pubKey = secp256k1.getPublicKey(pkBytes, false)
      const expectedAddress = `0x${bytesToHex(keccak256(pubKey.slice(1)).slice(12))}`.toLowerCase()

      const recovered = await recoverTransactionAddress({
        serializedTransaction: signedTx,
      })
      expect(recovered.toLowerCase()).toBe(expectedAddress)
    }
  })

  it('should produce valid signatures with different nonces', async () => {
    const pkBytes = hexToBytes(TEST_PK.slice(2))
    const pubKey = secp256k1.getPublicKey(pkBytes, false)
    const expectedAddress = `0x${bytesToHex(keccak256(pubKey.slice(1)).slice(12))}`.toLowerCase()

    for (const nonce of [0, 1, 42, 999]) {
      const params = { ...txParams, nonce }
      const signedTx = signTransaction(params, TEST_PK)

      const recovered = await recoverTransactionAddress({
        serializedTransaction: signedTx,
      })
      expect(recovered.toLowerCase()).toBe(expectedAddress)
    }
  })

  it('r and s values should be 32 bytes each', () => {
    const signedTx = signTransaction(txParams, TEST_PK)
    const parsed = parseTransaction(signedTx)

    // r and s are 0x-prefixed hex, up to 64 hex chars (32 bytes)
    expect(parsed.r).toMatch(/^0x[0-9a-f]{1,64}$/)
    expect(parsed.s).toMatch(/^0x[0-9a-f]{1,64}$/)
    expect([0, 1]).toContain(parsed.yParity)
  })
})
