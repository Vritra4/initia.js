/**
 * ethers.js Wallet → SDK DirectSigner bridge adapter.
 *
 * Uses duck typing (EthersWalletLike interface) to avoid
 * requiring ethers as a dependency. Users must install ethers
 * themselves if they want to use this adapter.
 */

import { secp256k1 } from '@noble/curves/secp256k1.js'
import { hexToBytes, bytesToHex } from '@noble/hashes/utils.js'
import { bech32 } from '@scure/base'
import { keccak256 } from '../../util/hash'
import { makeSignBytes } from '../../tx/sign'
import { packPubKey } from '../../util/public-key'
import type { DirectSigner, DirectSignDoc, DirectSignResponse } from '../types'

/**
 * Minimal interface matching ethers.js Wallet's key properties.
 * Users pass a real ethers.Wallet — we only access these fields.
 */
export interface EthersWalletLike {
  /** 0x-prefixed hex private key */
  privateKey: string
  /** ethers v6 SigningKey with compressedPublicKey */
  signingKey: {
    compressedPublicKey: string
  }
}

interface EthersToSignerOptions {
  bech32Prefix?: string
}

/**
 * Create a DirectSigner from an ethers.js Wallet instance.
 *
 * Only works with ethers.Wallet (local key wallets), not abstract Signer.
 * The adapter reads privateKey and compressedPublicKey from the wallet.
 *
 * @param wallet - ethers.js Wallet (or any object with privateKey + signingKey.compressedPublicKey)
 * @param options - Bech32 prefix configuration
 * @returns DirectSigner compatible with ChainContext.withSigner()
 *
 * @example
 * ```typescript
 * import { ethers } from 'ethers'
 * import { ethersWalletToSigner } from 'initia.js/signer'
 * import { createMinievmContext } from 'initia.js'
 *
 * const wallet = new ethers.Wallet('0x...')
 * const signer = ethersWalletToSigner(wallet)
 * const ctx = await createMinievmContext({ network: 'testnet', chainId: 'evm-1', signer })
 * ```
 */
export function ethersWalletToSigner(
  wallet: EthersWalletLike,
  options?: EthersToSignerOptions
): DirectSigner {
  const prefix = options?.bech32Prefix ?? 'init'
  const pkBytes = hexToBytes(wallet.privateKey.replace(/^0x/, ''))
  const publicKey = hexToBytes(wallet.signingKey.compressedPublicKey.replace(/^0x/, ''))

  // Derive address (ethsecp256k1)
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
