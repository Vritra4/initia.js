/**
 * Abstract base class for Initia key management.
 *
 * Handles both Cosmos-style and EVM-style address derivation:
 * - Cosmos: ripemd160(sha256(compressed_pubkey))
 * - EVM: keccak256(uncompressed_pubkey[1:])[12:32]
 *
 * Implements the Signer interface for compatibility with external key management.
 */

import { sha256, ripemd160, keccak256 } from '../util/hash'
import { secp256k1 } from '@noble/curves/secp256k1.js'
import { bech32, base64 } from '@scure/base'
import { bytesToHex } from '@noble/hashes/utils.js'
import type { AccAddress, ValAddress } from '../util/address'
import type {
  SigningAlgorithm,
  OfflineSigner,
  DirectSignDoc,
  DirectSignResponse,
  AminoSignDoc,
  AminoSignResponse,
} from '../signer/types'
import { makeSignBytes } from '../tx/sign'
import { sortObject } from '../tx/amino'
import { packPubKey, getAminoPubKeyType } from '../util/public-key'

/** Default bech32 prefix for Initia addresses */
export const DEFAULT_BECH32_PREFIX = 'init'

/**
 * Abstract base class for cryptographic key operations.
 *
 * Implements the Signer interface, making it compatible with:
 * - External key stores (KeyStore)
 * - Hardware wallets (Ledger)
 * - Browser extensions (Keplr, Leap)
 *
 * Subclasses must implement:
 * - publicKey: The compressed secp256k1 public key bytes
 * - isEth: Whether to use EVM-style address derivation
 * - sign(): Sign with SHA256 hash
 * - signWithKeccak256(): Sign with Keccak256 hash
 */
export abstract class Key implements OfflineSigner {
  /** Compressed secp256k1 public key (33 bytes) */
  abstract readonly publicKey: Uint8Array

  /** If true, uses EVM-style (keccak256) address derivation */
  abstract readonly isEth: boolean

  /**
   * Signing algorithm.
   * - 'eth_secp256k1' for Initia/Ethereum (isEth=true)
   * - 'secp256k1' for Cosmos chains (isEth=false)
   */
  get algorithm(): SigningAlgorithm {
    return this.isEth ? 'eth_secp256k1' : 'secp256k1'
  }

  /** Bech32 prefix for address encoding (default: 'init') */
  abstract readonly bech32Prefix: string

  /**
   * Sign a message with SHA256 hash.
   * @param message - Raw message bytes to sign
   * @returns ECDSA signature (64 bytes, r || s format)
   */
  abstract sign(message: Uint8Array): Promise<Uint8Array>

  /**
   * Sign a message with Keccak256 hash (EVM compatible).
   * @param message - Raw message bytes to sign
   * @returns ECDSA signature (64 bytes, r || s format)
   */
  abstract signWithKeccak256(message: Uint8Array): Promise<Uint8Array>

  // ========== Signer interface implementation ==========

  /**
   * Get the public key (Signer interface).
   * @returns Compressed secp256k1 public key (33 bytes)
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async getPublicKey(): Promise<Uint8Array> {
    return this.publicKey
  }

  /**
   * Get the bech32 address (Signer interface).
   * @param prefix - Address prefix (default: configured bech32Prefix)
   * @returns Bech32-encoded address
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async getAddress(prefix?: string): Promise<string> {
    const p = prefix ?? this.bech32Prefix
    return bech32.encode(p, bech32.toWords(this.rawAddress))
  }

  // ========== OfflineSigner interface implementation ==========

  /**
   * Sign a SignDoc directly (Protobuf encoding).
   * Implements DirectSigner.signDirect.
   */
  async signDirect(_signerAddress: string, signDoc: DirectSignDoc): Promise<DirectSignResponse> {
    const signBytes = makeSignBytes(
      signDoc.bodyBytes,
      signDoc.authInfoBytes,
      signDoc.chainId,
      signDoc.accountNumber
    )
    const signature = this.isEth
      ? await this.signWithKeccak256(signBytes)
      : await this.sign(signBytes)
    const pubKeyAny = packPubKey(this.publicKey, this.isEth ? 'ethsecp256k1' : 'secp256k1')

    return {
      signed: signDoc,
      signature: {
        pubKey: { typeUrl: pubKeyAny.typeUrl, value: pubKeyAny.value },
        signature,
      },
    }
  }

  /**
   * Sign an Amino JSON document.
   * Implements AminoSigner.signAmino.
   */
  async signAmino(_signerAddress: string, signDoc: AminoSignDoc): Promise<AminoSignResponse> {
    const sorted = sortObject(signDoc)
    const json = JSON.stringify(sorted)
    const signBytes = new TextEncoder().encode(json)
    const signature = this.isEth
      ? await this.signWithKeccak256(signBytes)
      : await this.sign(signBytes)

    const pubKeyType = getAminoPubKeyType(this.isEth ? 'ethsecp256k1' : 'secp256k1')

    return {
      signed: signDoc,
      signature: {
        pub_key: {
          type: pubKeyType,
          value: base64.encode(this.publicKey),
        },
        signature: base64.encode(signature),
      },
    }
  }

  // ========== EIP-191 signing ==========

  /**
   * Sign data with EIP-191 personal sign prefix.
   * Prepends "\x19Ethereum Signed Message:\n{length}" and signs with keccak256.
   *
   * @param data - Raw bytes to sign (typically Amino sign bytes)
   * @returns ECDSA signature (64 bytes, r || s)
   */
  async signPersonal(data: Uint8Array): Promise<Uint8Array> {
    const prefix = `\x19Ethereum Signed Message:\n${data.length}`
    const prefixBytes = new TextEncoder().encode(prefix)
    const prefixed = new Uint8Array(prefixBytes.length + data.length)
    prefixed.set(prefixBytes, 0)
    prefixed.set(data, prefixBytes.length)
    return this.signWithKeccak256(prefixed)
  }

  // ========== Address derivation ==========

  /**
   * Raw address bytes (20 bytes).
   * Derivation method depends on isEth flag.
   */
  get rawAddress(): Uint8Array {
    if (this.isEth) {
      // EVM: keccak256(uncompressed_pubkey[1:])[12:32]
      const point = secp256k1.Point.fromHex(bytesToHex(this.publicKey))
      const uncompressed = point.toBytes(false).slice(1) // remove 0x04 prefix
      return keccak256(uncompressed).slice(12)
    } else {
      // Cosmos: ripemd160(sha256(compressed_pubkey))
      return ripemd160(sha256(this.publicKey))
    }
  }

  /**
   * Account address (e.g., init1..., osmo1..., noble1...).
   * Uses bech32 encoding with the configured prefix.
   */
  get address(): AccAddress {
    return bech32.encode(this.bech32Prefix, bech32.toWords(this.rawAddress))
  }

  /**
   * Validator operator address (e.g., initvaloper1...).
   * Uses bech32 encoding with the configured prefix + 'valoper'.
   */
  get valAddress(): ValAddress {
    return bech32.encode(this.bech32Prefix + 'valoper', bech32.toWords(this.rawAddress))
  }

  /**
   * EVM hex address (0x...).
   * Always uses keccak256 derivation regardless of isEth flag.
   */
  get evmAddress(): string {
    const point = secp256k1.Point.fromHex(bytesToHex(this.publicKey))
    const uncompressed = point.toBytes(false).slice(1)
    return '0x' + bytesToHex(keccak256(uncompressed).slice(12))
  }

  /**
   * Verify a signature against a message.
   * Uses SHA256 hash for verification.
   * @param message - Original message bytes
   * @param signature - ECDSA signature (64 bytes)
   * @returns true if signature is valid
   */
  verify(message: Uint8Array, signature: Uint8Array): boolean {
    const msgHash = sha256(message)
    return secp256k1.verify(signature, msgHash, this.publicKey, { prehash: false })
  }
}
