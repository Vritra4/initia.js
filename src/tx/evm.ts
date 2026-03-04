/**
 * EVM Transaction utilities.
 *
 * Provides functions for building, signing, and sending EVM transactions
 * using the SDK's existing cryptographic primitives and EvmRpcClient.
 *
 * Bundle-optimized: uses viem only for `serializeTransaction` (EIP-1559 serialization),
 * avoids viem's WalletClient/PublicClient/privateKeyToAccount to prevent
 * double-bundling of secp256k1 and pulling in unused action modules.
 */

import { serializeTransaction, type TransactionSerializableEIP1559 } from 'viem'
import { secp256k1 } from '@noble/curves/secp256k1.js'
import { hexToBytes, bytesToHex } from '@noble/hashes/utils.js'
import { keccak256 } from '../util/hash'
import { EvmRpcClient } from '../client/evm-rpc'

// =============================================================================
// Types
// =============================================================================

export interface SendEvmTxOptions {
  /** EvmRpcClient instance or RPC URL string (creates a client internally) */
  rpc: EvmRpcClient | string
  /** Private key as 0x-prefixed hex (from RawKey.getPrivateKeyHex()) */
  privateKey: `0x${string}`
  /** Target contract/recipient address */
  to: `0x${string}`
  /** ABI-encoded calldata (0x-prefixed) */
  data: `0x${string}`
  /** Native token value in wei */
  value?: bigint
  /** Gas limit override (auto-estimated if omitted) */
  gasLimit?: bigint
  /** Max fee per gas override (auto-calculated if omitted) */
  maxFeePerGas?: bigint
  /** Max priority fee per gas override (defaults to gasPrice / 10) */
  maxPriorityFeePerGas?: bigint
}

export interface EvmTxResult {
  txHash: string
  status: 'success' | 'reverted'
  blockNumber: bigint
  gasUsed: bigint
}

// =============================================================================
// Internal helpers
// =============================================================================

/**
 * Derive EVM address from an uncompressed secp256k1 public key.
 * address = keccak256(pubkey[1:])[12:32]
 */
function publicKeyToEvmAddress(uncompressedPubKey: Uint8Array): `0x${string}` {
  // Strip the 0x04 prefix byte (uncompressed point marker)
  const pubKeyBody = uncompressedPubKey.slice(1)
  const hash = keccak256(pubKeyBody)
  return `0x${bytesToHex(hash.slice(12))}`
}

function resolveRpc(rpc: EvmRpcClient | string): EvmRpcClient {
  return typeof rpc === 'string' ? new EvmRpcClient(rpc) : rpc
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Send a raw EVM transaction and return the transaction hash.
 *
 * Handles nonce retrieval, gas estimation, EIP-1559 serialization, and signing
 * using the SDK's existing secp256k1 implementation (no viem account import).
 *
 * @example
 * ```typescript
 * const txHash = await sendEvmTx({
 *   rpc: 'https://1rpc.io/sepolia',
 *   privateKey: key.getPrivateKeyHex(),
 *   to: '0x...',
 *   data: '0x...',
 *   value: 1000000000000000n, // 0.001 ETH
 * })
 * ```
 */
export async function sendEvmTx(options: SendEvmTxOptions): Promise<string> {
  const rpc = resolveRpc(options.rpc)
  const privateKeyBytes = hexToBytes(options.privateKey.slice(2))
  const publicKey = secp256k1.getPublicKey(privateKeyBytes, false) // uncompressed
  const from = publicKeyToEvmAddress(publicKey)

  // 1. Fetch nonce, chainId, gasPrice in parallel
  const [nonce, chainId, gasPrice] = await Promise.all([
    rpc.getTransactionCount(from),
    rpc.getChainId(),
    rpc.getGasPrice(),
  ])

  // 2. Estimate gas (or use override)
  const gas =
    options.gasLimit ??
    (await rpc.estimateGas({
      from,
      to: options.to,
      data: options.data,
      value: options.value ? `0x${options.value.toString(16)}` : undefined,
    }))

  // 3. Build EIP-1559 transaction parameters
  const maxFeePerGas = options.maxFeePerGas ?? gasPrice * 2n
  const maxPriorityFeePerGas = options.maxPriorityFeePerGas ?? gasPrice / 10n

  const txParams: TransactionSerializableEIP1559 = {
    type: 'eip1559',
    chainId: Number(chainId),
    nonce: Number(nonce),
    to: options.to,
    data: options.data,
    value: options.value ?? 0n,
    maxFeePerGas,
    maxPriorityFeePerGas,
    gas,
  }

  // 4. Serialize unsigned transaction
  const serialized = serializeTransaction(txParams)

  // 5. Sign: keccak256(serialized) → ECDSA signature
  const txHash = keccak256(hexToBytes(serialized.slice(2)))
  const sigBytes = secp256k1.sign(txHash, privateKeyBytes, {
    prehash: false,
    format: 'recovered', // 65 bytes: recovery(1) || r(32) || s(32)
  })

  // 6. Serialize signed transaction
  const signedTx = serializeTransaction(txParams, {
    r: `0x${bytesToHex(sigBytes.slice(1, 33))}`,
    s: `0x${bytesToHex(sigBytes.slice(33, 65))}`,
    yParity: sigBytes[0] as 0 | 1,
  })

  // 7. Send via JSON-RPC
  return rpc.sendRawTransaction(signedTx)
}

/**
 * Send an EVM transaction and wait for the receipt.
 *
 * Polls `eth_getTransactionReceipt` until the transaction is confirmed
 * or the timeout is reached.
 *
 * @example
 * ```typescript
 * const result = await sendEvmTxAndWait({
 *   rpc: 'https://1rpc.io/sepolia',
 *   privateKey: key.getPrivateKeyHex(),
 *   to: '0x...',
 *   data: '0x...',
 * })
 * console.log(result.status) // 'success' or 'reverted'
 * ```
 */
export async function sendEvmTxAndWait(
  options: SendEvmTxOptions,
  pollIntervalMs = 2000,
  timeoutMs = 120_000
): Promise<EvmTxResult> {
  const txHash = await sendEvmTx(options)
  const rpc = resolveRpc(options.rpc)

  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const receipt = await rpc.getTransactionReceipt(txHash)
    if (receipt) {
      return {
        txHash,
        status: receipt.status === '0x1' ? 'success' : 'reverted',
        blockNumber: BigInt(receipt.blockNumber),
        gasUsed: BigInt(receipt.gasUsed),
      }
    }
    await new Promise(r => setTimeout(r, pollIntervalMs))
  }
  throw new Error(`Timeout waiting for EVM tx receipt: ${txHash}`)
}
