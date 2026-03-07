/**
 * Shared eth_secp256k1 DirectSigner factory.
 *
 * Used by both viem and ethers bridge adapters to avoid duplicating
 * the address derivation and signing logic.
 */

import { secp256k1 } from '@noble/curves/secp256k1.js'
import { bytesToHex } from '@noble/hashes/utils.js'
import { bech32 } from '@scure/base'
import { keccak256 } from '../../util/hash'
import { makeSignBytes } from '../../tx/sign'
import { packPubKey } from '../../util/public-key'
import type { DirectSigner, DirectSignDoc, DirectSignResponse } from '../types'

/**
 * Create a DirectSigner from raw eth_secp256k1 key material.
 *
 * @param pkBytes - 32-byte private key
 * @param publicKey - 33-byte compressed public key
 * @param prefix - Bech32 prefix (default: 'init')
 */
export function createEthSecp256k1Signer(
  pkBytes: Uint8Array,
  publicKey: Uint8Array,
  prefix: string
): DirectSigner {
  // Derive address (ethsecp256k1 = keccak256 of uncompressed[1:])
  const point = secp256k1.Point.fromHex(bytesToHex(publicKey))
  const uncompressed = point.toBytes(false).slice(1)
  const rawAddr = keccak256(uncompressed).slice(12)

  return {
    algorithm: 'eth_secp256k1',

    // eslint-disable-next-line @typescript-eslint/require-await
    async getPublicKey(): Promise<Uint8Array> {
      return publicKey
    },

    // eslint-disable-next-line @typescript-eslint/require-await
    async getAddress(pfx?: string): Promise<string> {
      return bech32.encode(pfx ?? prefix, bech32.toWords(rawAddr))
    },

    // eslint-disable-next-line @typescript-eslint/require-await
    async sign(data: Uint8Array): Promise<Uint8Array> {
      const hash = keccak256(data)
      return secp256k1.sign(hash, pkBytes, { prehash: false })
    },

    // eslint-disable-next-line @typescript-eslint/require-await
    async signDirect(_signerAddress: string, signDoc: DirectSignDoc): Promise<DirectSignResponse> {
      const signBytes = makeSignBytes(
        signDoc.bodyBytes,
        signDoc.authInfoBytes,
        signDoc.chainId,
        signDoc.accountNumber
      )
      const hash = keccak256(signBytes)
      const signature = secp256k1.sign(hash, pkBytes, { prehash: false })
      const pubKeyAny = packPubKey(publicKey, 'ethsecp256k1')

      return {
        signed: signDoc,
        signature: {
          pubKey: { typeUrl: pubKeyAny.typeUrl, value: pubKeyAny.value },
          signature,
        },
      }
    },
  }
}
