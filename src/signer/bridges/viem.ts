/**
 * Viem bridge adapters.
 *
 * Provides bidirectional conversion between SDK RawKey/DirectSigner
 * and viem LocalAccount. Zero viem runtime imports for types;
 * only serializeTransaction is used (already in bundle via src/tx/evm.ts).
 */

import { secp256k1 } from '@noble/curves/secp256k1.js'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js'
import { keccak256 } from '../../util/hash'
import { hashEIP191Message, hashEIP712TypedData } from './eip-hash'
import { serializeTransaction } from 'viem'
import type {
  LocalAccount,
  SignableMessage,
  TypedDataDefinition,
  TransactionSerializableEIP1559,
} from 'viem'
import type { RawKey } from '../../key'
import type { DirectSigner } from '../types'
import { createEthSecp256k1Signer } from './eth-signer'

/**
 * Convert an SDK RawKey into a viem-compatible LocalAccount.
 *
 * The returned account can be used with viem's `createWalletClient({ account })`,
 * `signMessage`, `signTransaction`, and `signTypedData`.
 *
 * @param key - SDK RawKey instance (must not be destroyed)
 * @returns viem LocalAccount
 * @throws if the key has been destroyed
 *
 * @example
 * ```typescript
 * import { RawKey } from 'initia.js'
 * import { keyToViemAccount } from 'initia.js/signer'
 * import { createWalletClient, http } from 'viem'
 *
 * const key = RawKey.fromHex('0x...')
 * const account = keyToViemAccount(key)
 * const client = createWalletClient({ account, transport: http(rpcUrl) })
 * ```
 */
export function keyToViemAccount(key: RawKey): LocalAccount {
  // Validate key is usable — getPrivateKeyHex() throws if destroyed
  const pkHex = key.getPrivateKeyHex()
  const pkBytes = hexToBytes(pkHex.slice(2))

  const address = key.evmAddress as `0x${string}`
  const publicKey = `0x${bytesToHex(key.publicKey)}`

  function signHash(hash: Uint8Array): `0x${string}` {
    // format: 'recovered' returns 65 bytes: recovery(1) || r(32) || s(32)
    const sig = secp256k1.sign(hash, pkBytes, {
      prehash: false,
      lowS: true,
      format: 'recovered',
    })
    const recovery = sig[0]
    const r = bytesToHex(sig.slice(1, 33))
    const s = bytesToHex(sig.slice(33, 65))
    const v = recovery === 0 ? '1b' : '1c' // 27 or 28
    return `0x${r}${s}${v}`
  }

  return {
    address,
    publicKey,
    type: 'local',
    source: 'custom',

    // eslint-disable-next-line @typescript-eslint/require-await
    async signMessage({ message }: { message: SignableMessage }): Promise<`0x${string}`> {
      const hashHex = hashEIP191Message(message as string | { raw: Uint8Array })
      const hash = hexToBytes(hashHex.slice(2))
      return signHash(hash)
    },

    // eslint-disable-next-line @typescript-eslint/require-await
    async signTransaction(tx: TransactionSerializableEIP1559): Promise<`0x${string}`> {
      const serialized = serializeTransaction(tx)
      const hash = keccak256(hexToBytes(serialized.slice(2)))
      // format: 'recovered' returns 65 bytes: recovery(1) || r(32) || s(32)
      const sig = secp256k1.sign(hash, pkBytes, {
        prehash: false,
        lowS: true,
        format: 'recovered',
      })
      const r: `0x${string}` = `0x${bytesToHex(sig.slice(1, 33))}`
      const s: `0x${string}` = `0x${bytesToHex(sig.slice(33, 65))}`
      return serializeTransaction(tx, { r, s, yParity: sig[0] as 0 | 1 })
    },

    // eslint-disable-next-line @typescript-eslint/require-await
    async signTypedData(params: TypedDataDefinition): Promise<`0x${string}`> {
      const hashHex = hashEIP712TypedData(
        params as unknown as Parameters<typeof hashEIP712TypedData>[0]
      )
      const hash = hexToBytes(hashHex.slice(2))
      return signHash(hash)
    },
  } as LocalAccount
}

// =============================================================================
// viemAccountToSigner: EVM private key → SDK DirectSigner
// =============================================================================

interface ViemToSignerOptions {
  /** Bech32 prefix (default: 'init') */
  bech32Prefix?: string
}

/**
 * Create a DirectSigner from an EVM private key hex.
 *
 * This allows using an EVM private key (from viem's privateKeyToAccount,
 * MetaMask export, etc.) with the SDK's Cosmos signing infrastructure.
 *
 * @param privateKeyHex - 0x-prefixed hex private key
 * @param options - Bech32 prefix configuration
 * @returns DirectSigner compatible with ChainContext.withSigner()
 *
 * @example
 * ```typescript
 * import { viemAccountToSigner } from 'initia.js/signer'
 * import { createMinievmContext } from 'initia.js'
 *
 * const signer = viemAccountToSigner('0x...')
 * const ctx = await createMinievmContext({ network: 'testnet', chainId: 'evm-1', signer })
 * await ctx.signAndBroadcast(msgs)
 * ```
 */
export function viemAccountToSigner(
  privateKeyHex: `0x${string}`,
  options?: ViemToSignerOptions
): DirectSigner {
  const pkBytes = hexToBytes(privateKeyHex.slice(2))
  const publicKey = secp256k1.getPublicKey(pkBytes, true)
  return createEthSecp256k1Signer(pkBytes, publicKey, options?.bech32Prefix ?? 'init')
}
