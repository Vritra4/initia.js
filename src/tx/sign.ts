/**
 * Transaction signing utilities for Initia SDK.
 *
 * Supports:
 * - SIGN_MODE_DIRECT (protobuf)
 * - SIGN_MODE_LEGACY_AMINO_JSON (canonical JSON)
 * - SIGN_MODE_EIP_191 (Ethereum personal sign)
 */

import type { Numeric } from '../types'
import { toBinary, fromBinary, create } from '@bufbuild/protobuf'
import {
  SignDocSchema,
  TxRawSchema,
} from '@initia/initia-proto/cosmos/tx/v1beta1/tx_pb'
import type { DirectSignDoc } from '../signer/types'
import type { Key } from '../key'
import type { AminoMsg } from './amino'
import { sortObject } from './amino'

/**
 * Options for signing a transaction.
 */
export interface SignOptions {
  /** Chain ID (e.g., 'initiation-2') */
  chainId: string
  /** Account number on chain */
  accountNumber: Numeric
  /** Account sequence (nonce) */
  sequence: Numeric
}

/**
 * Create sign bytes for SIGN_MODE_DIRECT.
 *
 * @param bodyBytes - Serialized TxBody
 * @param authInfoBytes - Serialized AuthInfo
 * @param chainId - Chain ID
 * @param accountNumber - Account number
 * @returns Sign bytes to be signed
 */
export function makeSignBytes(
  bodyBytes: Uint8Array,
  authInfoBytes: Uint8Array,
  chainId: string,
  accountNumber: Numeric
): Uint8Array {
  const signDoc = create(SignDocSchema, {
    bodyBytes,
    authInfoBytes,
    chainId,
    accountNumber: BigInt(accountNumber),
  })
  return toBinary(SignDocSchema, signDoc)
}

/**
 * Serialize an unsigned transaction (DirectSignDoc) to bytes.
 * Alias for makeSignBytes that accepts a DirectSignDoc object.
 *
 * @param doc - Unsigned transaction
 * @returns Protobuf-encoded SignDoc bytes
 */
export function serializeUnsignedTx(doc: DirectSignDoc): Uint8Array {
  return makeSignBytes(doc.bodyBytes, doc.authInfoBytes, doc.chainId, doc.accountNumber)
}

/**
 * Deserialize bytes back into an unsigned transaction (DirectSignDoc).
 *
 * @param bytes - Protobuf-encoded SignDoc bytes
 * @returns Unsigned transaction
 */
export function deserializeUnsignedTx(bytes: Uint8Array): DirectSignDoc {
  const signDoc = fromBinary(SignDocSchema, bytes)
  return {
    bodyBytes: signDoc.bodyBytes,
    authInfoBytes: signDoc.authInfoBytes,
    chainId: signDoc.chainId,
    accountNumber: signDoc.accountNumber,
  }
}

/**
 * A signed transaction document (TxRaw).
 */
export interface SignedTxDoc {
  bodyBytes: Uint8Array
  authInfoBytes: Uint8Array
  signatures: Uint8Array[]
}

/**
 * Serialize a signed transaction (TxRaw) to bytes.
 *
 * @param doc - Signed transaction
 * @returns Protobuf-encoded TxRaw bytes
 */
export function serializeSignedTx(doc: SignedTxDoc): Uint8Array {
  const txRaw = create(TxRawSchema, {
    bodyBytes: doc.bodyBytes,
    authInfoBytes: doc.authInfoBytes,
    signatures: doc.signatures,
  })
  return toBinary(TxRawSchema, txRaw)
}

/**
 * Deserialize bytes back into a signed transaction (TxRaw).
 *
 * @param bytes - Protobuf-encoded TxRaw bytes
 * @returns Signed transaction
 */
export function deserializeSignedTx(bytes: Uint8Array): SignedTxDoc {
  const txRaw = fromBinary(TxRawSchema, bytes)
  return {
    bodyBytes: txRaw.bodyBytes,
    authInfoBytes: txRaw.authInfoBytes,
    signatures: [...txRaw.signatures],
  }
}

/**
 * Sign with SIGN_MODE_DIRECT.
 *
 * @param key - Key to sign with
 * @param signBytes - Sign bytes from makeSignBytes()
 * @returns ECDSA signature (64 bytes, r || s)
 */
export async function signDirect(key: Key, signBytes: Uint8Array): Promise<Uint8Array> {
  return key.sign(signBytes)
}

/**
 * Standard fee structure for Amino signing.
 */
export interface StdFee {
  amount: { denom: string; amount: string }[]
  gas: string
}

/**
 * Standard sign document for SIGN_MODE_LEGACY_AMINO_JSON.
 * All fields are strings for canonical JSON serialization.
 */
export interface StdSignDoc {
  account_number: string
  chain_id: string
  fee: StdFee
  memo: string
  msgs: AminoMsg[]
  sequence: string
}

/**
 * Create a standard sign document for Amino signing.
 *
 * @param msgs - Amino-formatted messages
 * @param fee - Transaction fee
 * @param chainId - Chain ID
 * @param memo - Transaction memo
 * @param accountNumber - Account number
 * @param sequence - Account sequence
 * @returns StdSignDoc ready for canonical JSON serialization
 */
export function makeStdSignDoc(
  msgs: AminoMsg[],
  fee: StdFee,
  chainId: string,
  memo: string,
  accountNumber: Numeric,
  sequence: Numeric
): StdSignDoc {
  return {
    account_number: accountNumber.toString(),
    chain_id: chainId,
    fee,
    memo,
    msgs,
    sequence: sequence.toString(),
  }
}

/**
 * Create sign bytes for SIGN_MODE_LEGACY_AMINO_JSON.
 *
 * The sign bytes are the UTF-8 encoded canonical JSON of the StdSignDoc.
 * Canonical JSON means keys are sorted alphabetically.
 *
 * @param signDoc - Standard sign document
 * @returns UTF-8 encoded canonical JSON bytes
 */
export function makeAminoSignBytes(signDoc: StdSignDoc): Uint8Array {
  const sorted = sortObject(signDoc)
  const json = JSON.stringify(sorted)
  return new TextEncoder().encode(json)
}

/**
 * Sign with SIGN_MODE_LEGACY_AMINO_JSON.
 *
 * @param key - Key to sign with
 * @param signDoc - Standard sign document
 * @returns ECDSA signature (64 bytes, r || s)
 */
export async function signAmino(key: Key, signDoc: StdSignDoc): Promise<Uint8Array> {
  const signBytes = makeAminoSignBytes(signDoc)
  return key.sign(signBytes)
}

/**
 * Create sign bytes for SIGN_MODE_EIP_191 (Ethereum personal sign).
 *
 * This prepends the Ethereum personal sign prefix to Amino sign bytes:
 * "\x19Ethereum Signed Message:\n" + length + message
 *
 * Used for Ledger Ethereum app compatibility.
 *
 * @param signDoc - Standard sign document
 * @returns Prefixed sign bytes for keccak256 hashing
 */
export function makeEIP191SignBytes(signDoc: StdSignDoc): Uint8Array {
  const aminoBytes = makeAminoSignBytes(signDoc)
  const prefix = `\x19Ethereum Signed Message:\n${aminoBytes.length}`
  const prefixBytes = new TextEncoder().encode(prefix)

  // Concatenate prefix + amino bytes
  const result = new Uint8Array(prefixBytes.length + aminoBytes.length)
  result.set(prefixBytes, 0)
  result.set(aminoBytes, prefixBytes.length)

  return result
}

/**
 * Sign with SIGN_MODE_EIP_191 (Ethereum personal sign).
 *
 * Uses keccak256 for hashing (Ethereum-style).
 *
 * @param key - Key to sign with (must support signWithKeccak256)
 * @param signDoc - Standard sign document
 * @returns ECDSA signature (64 bytes, r || s)
 */
export async function signEIP191(key: Key, signDoc: StdSignDoc): Promise<Uint8Array> {
  const signBytes = makeEIP191SignBytes(signDoc)
  return key.signWithKeccak256(signBytes)
}
