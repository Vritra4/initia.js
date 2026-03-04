// test/unit/signer/bridges/ethers.spec.ts
import { describe, it, expect } from 'vitest'
import { ethersWalletToSigner } from '../../../../src/signer/bridges/ethers'
import { isDirectSigner } from '../../../../src/signer'
import { RawKey } from '../../../../src/key'
import { makeSignBytes } from '../../../../src/tx/sign'
import { keccak256 } from '../../../../src/util/hash'
import { secp256k1 } from '@noble/curves/secp256k1.js'
import { bytesToHex } from '@noble/hashes/utils.js'

const PRIVATE_KEY_HEX = `0x${'01'.repeat(32)}`

// Minimal mock that matches the ethers.Wallet shape
function createMockWallet(pkHex: string) {
  const pkBytes = Uint8Array.from(
    pkHex
      .slice(2)
      .match(/.{2}/g)!
      .map(b => parseInt(b, 16))
  )
  const pubKeyCompressed = secp256k1.getPublicKey(pkBytes, true)

  return {
    privateKey: pkHex,
    signingKey: {
      compressedPublicKey: `0x${bytesToHex(pubKeyCompressed)}`,
    },
  }
}

describe('ethersWalletToSigner', () => {
  it('should return a DirectSigner', () => {
    const wallet = createMockWallet(PRIVATE_KEY_HEX)
    const signer = ethersWalletToSigner(wallet)

    expect(isDirectSigner(signer)).toBe(true)
    expect(signer.algorithm).toBe('eth_secp256k1')
  })

  it('getPublicKey() should return compressed 33-byte pubkey', async () => {
    const wallet = createMockWallet(PRIVATE_KEY_HEX)
    const signer = ethersWalletToSigner(wallet)
    const pubKey = await signer.getPublicKey()

    expect(pubKey).toBeInstanceOf(Uint8Array)
    expect(pubKey.length).toBe(33)
  })

  it('getAddress() should return bech32 address', async () => {
    const wallet = createMockWallet(PRIVATE_KEY_HEX)
    const signer = ethersWalletToSigner(wallet)
    const address = await signer.getAddress()

    expect(address).toMatch(/^init1/)
  })

  it('signDirect() should match RawKey signature', async () => {
    const wallet = createMockWallet(PRIVATE_KEY_HEX)
    const signer = ethersWalletToSigner(wallet)
    const key = new RawKey(new Uint8Array(32).fill(1))

    const signDoc = {
      bodyBytes: new Uint8Array([10, 20, 30]),
      authInfoBytes: new Uint8Array([40, 50, 60]),
      chainId: 'test-chain',
      accountNumber: 7n,
    }

    const signerResponse = await signer.signDirect(await signer.getAddress(), signDoc)
    const keyResponse = await key.signDirect(key.address, signDoc)

    expect(signerResponse.signature.signature).toEqual(keyResponse.signature.signature)
  })

  it('signDirect() signature should be cryptographically verifiable', async () => {
    const wallet = createMockWallet(PRIVATE_KEY_HEX)
    const signer = ethersWalletToSigner(wallet)

    const signDoc = {
      bodyBytes: new Uint8Array([10, 20, 30]),
      authInfoBytes: new Uint8Array([40, 50, 60]),
      chainId: 'test-chain',
      accountNumber: 7n,
    }

    const response = await signer.signDirect(await signer.getAddress(), signDoc)
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
})
