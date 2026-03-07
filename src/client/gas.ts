/**
 * Gas estimation module - Estimate gas for transactions.
 */

import { create } from '@bufbuild/protobuf'
import { type MsgInput, normalizeMsg } from '../msgs/types'
import {
  TxSchema,
  TxBodySchema,
  AuthInfoSchema,
  SignerInfoSchema,
  ModeInfoSchema,
  FeeSchema,
} from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/tx/v1beta1/tx_pb'
import { SignMode } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/tx/signing/v1beta1/signing_pb'
import { Coin } from '../core/coin'
import { getAccount, type AuthClient } from '../core/account'
import { AccountNotFoundError, ParseError, SimulationError } from '../errors'

/**
 * Gas estimation result.
 */
export interface GasEstimate {
  /** Estimated gas limit (with multiplier applied) */
  gasLimit: bigint
  /** Calculated fee based on gas limit and gas price */
  fee: Coin[]
}

/**
 * Options for gas estimation.
 */
export interface EstimateOptions {
  /** Gas multiplier (default: 1.3) */
  multiplier?: number
  /** Gas price (e.g., '0.015uinit') */
  gasPrice?: string
}

/**
 * Minimal client interface for gas estimation.
 * Compatible with any client that has tx.simulate and auth.account services.
 */
export interface SimulateClient extends AuthClient {
  tx: {
    simulate(request: { txBytes?: Uint8Array; tx?: unknown }): Promise<{
      gasInfo?: {
        gasUsed: bigint
        gasWanted: bigint
      }
    }>
  }
}

/**
 * Parse gas price string into denom and amount.
 * @param gasPrice - e.g., '0.015uinit'
 * @returns { amount: string, denom: string }
 */
function parseGasPrice(gasPrice: string): { amount: string; denom: string } {
  // Match number (including decimal) followed by denom
  const match = gasPrice.match(/^([\d.]+)(.+)$/)
  if (!match) {
    throw new ParseError('gasPrice', `Invalid format: ${gasPrice}`)
  }
  return {
    amount: match[1],
    denom: match[2],
  }
}

/**
 * Calculate fee from gas limit and gas price.
 */
function calculateFee(gasLimit: bigint, gasPrice: string): Coin[] {
  const { amount, denom } = parseGasPrice(gasPrice)
  const feeAmount = mulBigIntByFloat(gasLimit, parseFloat(amount))
  return [new Coin(denom, feeAmount)]
}

/**
 * Multiply a bigint by a float using fixed-point arithmetic.
 * Avoids Number(bigint) precision loss for values > 2^53.
 */
function mulBigIntByFloat(value: bigint, multiplier: number): bigint {
  const PRECISION = 1_000_000n
  const scaledMultiplier = BigInt(Math.ceil(multiplier * Number(PRECISION)))
  return (value * scaledMultiplier + PRECISION - 1n) / PRECISION // ceil division
}

/**
 * Estimate gas for a transaction.
 *
 * Uses the simulate endpoint to get accurate gas estimation.
 *
 * @param client - gRPC client with tx service
 * @param msgs - Messages to estimate gas for
 * @param signer - Signer address (for simulation)
 * @param options - Estimation options
 * @returns Gas estimate with fee
 *
 * @example
 * ```typescript
 * const estimate = await estimateGas(client, [sendMsg], wallet.address, {
 *   multiplier: 1.3,
 *   gasPrice: '0.015uinit'
 * })
 *
 * console.log('Gas limit:', estimate.gasLimit)
 * console.log('Fee:', estimate.fee)
 * ```
 */
export async function estimateGas(
  client: SimulateClient,
  msgs: MsgInput[],
  _signer: string,
  options?: EstimateOptions
): Promise<GasEstimate> {
  const multiplier = options?.multiplier ?? 1.3
  const gasPrice = options?.gasPrice ?? '0.015uinit'

  // Fetch current account sequence for accurate simulation
  let sequence = 0n
  try {
    const account = await getAccount(client, _signer)
    sequence = account.sequence
  } catch (error) {
    // Account not found = new account, sequence 0 is correct.
    // Any other error (network, auth) should propagate.
    if (!(error instanceof AccountNotFoundError)) {
      throw error
    }
  }

  // Create a minimal tx for simulation
  // Note: For simulation, we don't need a valid signature
  const txBody = create(TxBodySchema, {
    messages: msgs.map(m => normalizeMsg(m).toAny()),
    memo: '',
    timeoutHeight: 0n,
    extensionOptions: [],
    nonCriticalExtensionOptions: [],
  })

  // Create minimal auth info (empty signature is ok for simulation)
  const signerInfo = create(SignerInfoSchema, {
    publicKey: undefined, // Not needed for simulation
    modeInfo: create(ModeInfoSchema, {
      sum: {
        case: 'single',
        value: { mode: SignMode.DIRECT },
      },
    }),
    sequence,
  })

  const fee = create(FeeSchema, {
    amount: [],
    gasLimit: 0n,
    payer: '',
    granter: '',
  })

  const authInfo = create(AuthInfoSchema, {
    signerInfos: [signerInfo],
    fee,
    tip: undefined,
  })

  // Create the tx for simulation
  const tx = create(TxSchema, {
    body: txBody,
    authInfo,
    signatures: [new Uint8Array(64)], // Empty signature for simulation
  })

  // Simulate the transaction
  const response = await client.tx.simulate({
    tx: tx as unknown,
  })

  if (!response.gasInfo) {
    throw new SimulationError('No gas info returned')
  }

  // Apply multiplier and calculate fee
  const gasUsed = response.gasInfo.gasUsed
  const gasLimit = mulBigIntByFloat(gasUsed, multiplier)
  const calculatedFee = calculateFee(gasLimit, gasPrice)

  return {
    gasLimit,
    fee: calculatedFee,
  }
}
