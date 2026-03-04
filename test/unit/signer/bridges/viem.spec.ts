// test/unit/signer/bridges/viem.spec.ts
import { describe, it, expect } from 'vitest'
import { RawKey } from '../../../../src/key'
import { keyToViemAccount, viemAccountToSigner } from '../../../../src/signer/bridges/viem'
import { isDirectSigner } from '../../../../src/signer'
import { makeSignBytes } from '../../../../src/tx/sign'
import { keccak256 } from '../../../../src/util/hash'
import { isAddress, verifyMessage } from 'viem'
import { secp256k1 } from '@noble/curves/secp256k1.js'

const TEST_PRIVATE_KEY = new Uint8Array(32).fill(1)

describe('keyToViemAccount', () => {
  it('should return a valid LocalAccount shape', () => {
    const key = new RawKey(TEST_PRIVATE_KEY)
    const account = keyToViemAccount(key)

    expect(account.type).toBe('local')
    expect(account.source).toBe('custom')
    expect(isAddress(account.address)).toBe(true)
    expect(account.address.toLowerCase()).toBe(key.evmAddress.toLowerCase())
    expect(typeof account.signMessage).toBe('function')
    expect(typeof account.signTransaction).toBe('function')
    expect(typeof account.signTypedData).toBe('function')
  })

  it('should have correct publicKey as hex', () => {
    const key = new RawKey(TEST_PRIVATE_KEY)
    const account = keyToViemAccount(key)

    // viem uses 0x-prefixed hex for publicKey
    expect(account.publicKey).toMatch(/^0x[0-9a-f]{66}$/) // compressed 33 bytes = 66 hex chars
  })

  it('signMessage should produce a 65-byte recoverable signature', async () => {
    const key = new RawKey(TEST_PRIVATE_KEY)
    const account = keyToViemAccount(key)

    const sig = await account.signMessage({ message: 'hello' })

    // 65 bytes = 130 hex chars + 0x prefix
    expect(sig).toMatch(/^0x[0-9a-f]{130}$/)
  })

  it('signMessage result should be verifiable by viem', async () => {
    const key = new RawKey(TEST_PRIVATE_KEY)
    const account = keyToViemAccount(key)
    const message = 'test message for verification'

    const sig = await account.signMessage({ message })
    const valid = await verifyMessage({ address: account.address, message, signature: sig })

    expect(valid).toBe(true)
  })

  it('should throw if key is destroyed', () => {
    const key = new RawKey(new Uint8Array(32).fill(2))
    key.destroy()

    expect(() => keyToViemAccount(key)).toThrow()
  })
})

const PK_HEX = `0x${'01'.repeat(32)}` as `0x${string}`

describe('viemAccountToSigner', () => {
  it('should return a DirectSigner', () => {
    const signer = viemAccountToSigner(PK_HEX)

    expect(isDirectSigner(signer)).toBe(true)
    expect(signer.algorithm).toBe('eth_secp256k1')
  })

  it('getPublicKey() should return compressed 33-byte pubkey', async () => {
    const signer = viemAccountToSigner(PK_HEX)
    const pubKey = await signer.getPublicKey()

    expect(pubKey).toBeInstanceOf(Uint8Array)
    expect(pubKey.length).toBe(33)
  })

  it('getAddress() should return bech32 address', async () => {
    const signer = viemAccountToSigner(PK_HEX)
    const address = await signer.getAddress()

    expect(address).toMatch(/^init1/)
  })

  it('getAddress() with custom prefix', async () => {
    const signer = viemAccountToSigner(PK_HEX, { bech32Prefix: 'osmo' })
    const address = await signer.getAddress('osmo')

    expect(address).toMatch(/^osmo1/)
  })

  it('signDirect() should produce verifiable signature', async () => {
    const signer = viemAccountToSigner(PK_HEX)
    const signDoc = {
      bodyBytes: new Uint8Array([10, 20, 30]),
      authInfoBytes: new Uint8Array([40, 50, 60]),
      chainId: 'initiation-2',
      accountNumber: 42n,
    }

    const response = await signer.signDirect(await signer.getAddress(), signDoc)

    // Verify signature
    expect(response.signature.signature.length).toBe(64)
    const signBytes = makeSignBytes(
      signDoc.bodyBytes,
      signDoc.authInfoBytes,
      signDoc.chainId,
      signDoc.accountNumber
    )
    const msgHash = keccak256(signBytes)
    const pubKey = await signer.getPublicKey()
    expect(
      secp256k1.verify(response.signature.signature, msgHash, pubKey, { prehash: false })
    ).toBe(true)
  })

  it('should produce identical signatures to RawKey for same private key', async () => {
    const key = new RawKey(new Uint8Array(32).fill(1))
    const signer = viemAccountToSigner(PK_HEX)
    const signDoc = {
      bodyBytes: new Uint8Array([1, 2, 3]),
      authInfoBytes: new Uint8Array([4, 5, 6]),
      chainId: 'test-chain',
      accountNumber: 1n,
    }

    const keyResponse = await key.signDirect(key.address, signDoc)
    const signerResponse = await signer.signDirect(await signer.getAddress(), signDoc)

    expect(signerResponse.signature.signature).toEqual(keyResponse.signature.signature)
    expect(await signer.getPublicKey()).toEqual(key.publicKey)
  })
})
