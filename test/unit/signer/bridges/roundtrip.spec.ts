// test/unit/signer/bridges/roundtrip.spec.ts
import { describe, it, expect } from 'vitest'
import { RawKey } from '../../../../src/key'
import { keyToViemAccount, viemAccountToSigner } from '../../../../src/signer/bridges/viem'
import { verifyMessage } from 'viem'

describe('Round-trip: RawKey → viemAccount → viemAccountToSigner', () => {
  const pkBytes = new Uint8Array(32).fill(42)
  const pkHex = `0x${Array.from(pkBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')}` as `0x${string}`

  it('RawKey and round-tripped signer should produce identical Cosmos signatures', async () => {
    const key = new RawKey(pkBytes)
    const roundTripped = viemAccountToSigner(pkHex)

    const signDoc = {
      bodyBytes: new Uint8Array([0xaa, 0xbb]),
      authInfoBytes: new Uint8Array([0xcc, 0xdd]),
      chainId: 'roundtrip-test',
      accountNumber: 99n,
    }

    const keyResponse = await key.signDirect(key.address, signDoc)
    const roundTrippedResponse = await roundTripped.signDirect(
      await roundTripped.getAddress(),
      signDoc
    )

    // Cosmos signatures must be identical
    expect(roundTrippedResponse.signature.signature).toEqual(keyResponse.signature.signature)

    // Public keys must match
    expect(await roundTripped.getPublicKey()).toEqual(key.publicKey)

    // Addresses must match
    expect(await roundTripped.getAddress()).toBe(key.address)
  })

  it('viemAccount should produce valid EVM signatures verifiable by viem', async () => {
    const key = new RawKey(pkBytes)
    const account = keyToViemAccount(key)

    const message = 'cross-verification test'
    const sig = await account.signMessage({ message })
    const valid = await verifyMessage({
      address: account.address,
      message,
      signature: sig,
    })

    expect(valid).toBe(true)
  })

  it('same key should produce same EVM address across SDK and viem', () => {
    const key = new RawKey(pkBytes)
    const account = keyToViemAccount(key)

    expect(account.address.toLowerCase()).toBe(key.evmAddress.toLowerCase())
  })
})
