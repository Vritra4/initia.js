/**
 * ethers.js Wallet → SDK DirectSigner bridge adapter.
 *
 * Uses duck typing (EthersWalletLike interface) to avoid
 * requiring ethers as a dependency. Users must install ethers
 * themselves if they want to use this adapter.
 */

import { hexToBytes } from '@noble/hashes/utils.js'
import type { DirectSigner } from '../types'
import { createEthSecp256k1Signer } from './eth-signer'

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
  const pkBytes = hexToBytes(wallet.privateKey.replace(/^0x/, ''))
  const publicKey = hexToBytes(wallet.signingKey.compressedPublicKey.replace(/^0x/, ''))
  return createEthSecp256k1Signer(pkBytes, publicKey, options?.bech32Prefix ?? 'init')
}
