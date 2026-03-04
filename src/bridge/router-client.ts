/**
 * RouterClient — fetch wrapper for the Initia Router API.
 *
 * Handles snake_case ↔ camelCase conversion and preserves raw server
 * responses via Route._raw for safe roundtrip in buildTransferMsgs().
 *
 * @internal Used by Bridge class. Not exported publicly.
 */

import type {
  Route,
  RouteOptions,
  RouteOperation,
  BuildTransferMsgsOptions,
  TransferTx,
  OpHookOptions,
  OpHookResult,
  TransferStatus,
} from './types'
import { Message } from '../msgs/types'
import { create } from '@bufbuild/protobuf'
import { AnySchema } from '@bufbuild/protobuf/wkt'
import { InitiaError } from '../errors'
import { base64ToUint8Array } from '../tx/amino'
import { fetchWithTimeout } from '../util/fetch'

// =============================================================================
// Raw response types — snake_case shapes from the Router API
// @internal Not exported; used only for type-safe normalization.
// =============================================================================

interface RawRouteResponse {
  amount_in: string
  amount_out: string
  source_asset_chain_id: string
  source_asset_denom: string
  source_asset_symbol?: string
  dest_asset_chain_id: string
  dest_asset_denom: string
  dest_asset_symbol?: string
  operations?: RawOperation[]
  estimated_duration_seconds?: number
  usd_amount_in?: string
  usd_amount_out?: string
  warnings?: string[]
  required_op_hook?: boolean
}

interface RawOperation {
  type?: string
  op_type?: string
  chain_id?: string
  channel?: string
  pool_id?: string
  denom_in?: string
  denom_out?: string
}

interface RawCosmosTx {
  chain_id?: string
  signer_address?: string
  msgs?: Array<{ msg_type_url: string; msg: string }>
}

interface RawEvmTx {
  chain_id?: string
  signer_address?: string
  to: string
  data: string
  value?: string
}

interface RawTransferTx {
  chain_id?: string
  signer_address?: string
  cosmos_tx?: RawCosmosTx
  evm_tx?: RawEvmTx
}

interface RawTransferTxsResponse {
  txs?: RawTransferTx[]
  msgs?: RawTransferTx[]
}

interface RawOpHookResponse {
  chain_id: string
  hook: string[]
}

interface RawStatusResponse {
  status: 'pending' | 'complete' | 'failed'
  tx_hash: string
}

// =============================================================================

export class RouterClient {
  constructor(private baseUrl: string) {}

  async route(opts: RouteOptions): Promise<Route> {
    const body = {
      amount_in: opts.amount,
      source_asset_chain_id: opts.source.chainId,
      source_asset_denom: opts.source.denom,
      dest_asset_chain_id: opts.dest.chainId,
      dest_asset_denom: opts.dest.denom,
      allow_unsafe: opts.allowUnsafe,
      go_fast: opts.goFast,
    }
    const res = await this.post('/v2/fungible/route', body)
    return normalizeRouteResponse((await res.json()) as RawRouteResponse)
  }

  async msgs(opts: BuildTransferMsgsOptions): Promise<TransferTx[]> {
    // Use route._raw to preserve server's original operations (roundtrip-safe)
    const raw = opts.route._raw as RawRouteResponse
    const body = {
      amount_in: raw.amount_in,
      amount_out: raw.amount_out,
      source_asset_chain_id: raw.source_asset_chain_id,
      source_asset_denom: raw.source_asset_denom,
      dest_asset_chain_id: raw.dest_asset_chain_id,
      dest_asset_denom: raw.dest_asset_denom,
      address_list: opts.addresses,
      operations: raw.operations,
      slippage_tolerance_percent: opts.slippageTolerance ?? '1',
      signed_op_hook: opts.signedOpHook,
    }
    const res = await this.post('/v2/fungible/msgs', body)
    return normalizeTransferTxs((await res.json()) as RawTransferTxsResponse)
  }

  async opHook(opts: OpHookOptions): Promise<OpHookResult> {
    const body = {
      source_address: opts.sourceAddress,
      source_asset_chain_id: opts.sourceChainId,
      source_asset_denom: opts.sourceDenom,
      dest_address: opts.destAddress,
      dest_asset_chain_id: opts.destChainId,
      dest_asset_denom: opts.destDenom,
    }
    const res = await this.post('/op-hook', body)
    return normalizeOpHookResponse((await res.json()) as RawOpHookResponse)
  }

  async track(txHash: string, chainId: string): Promise<void> {
    await this.post('/v2/tx/track', { tx_hash: txHash, chain_id: chainId })
  }

  async status(txHash: string, chainId: string): Promise<TransferStatus> {
    const params = new URLSearchParams({ tx_hash: txHash, chain_id: chainId })
    const res = await fetchWithTimeout(`${this.baseUrl}/v2/tx/status?${params.toString()}`)
    if (!res.ok) {
      throw new InitiaError(`Router API error: ${res.status} ${res.statusText}`)
    }
    return normalizeStatus((await res.json()) as RawStatusResponse)
  }

  private async post(path: string, body: unknown): Promise<Response> {
    const res = await fetchWithTimeout(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      throw new InitiaError(`Router API error: ${res.status} ${res.statusText}`)
    }
    return res
  }
}

// =============================================================================
// Normalization functions — snake_case (server) → camelCase (SDK)
// =============================================================================

/**
 * Normalize route response. Preserves the entire raw response in `_raw`
 * so that buildTransferMsgs() can pass server-original data without loss.
 */
function normalizeRouteResponse(raw: RawRouteResponse): Route {
  return {
    amountIn: raw.amount_in,
    amountOut: raw.amount_out,
    source: {
      chainId: raw.source_asset_chain_id,
      denom: raw.source_asset_denom,
      symbol: raw.source_asset_symbol,
    },
    dest: {
      chainId: raw.dest_asset_chain_id,
      denom: raw.dest_asset_denom,
      symbol: raw.dest_asset_symbol,
    },
    operations: normalizeOperations(raw.operations ?? []),
    estimatedDurationSeconds: raw.estimated_duration_seconds,
    usdAmountIn: raw.usd_amount_in,
    usdAmountOut: raw.usd_amount_out,
    warnings: raw.warnings,
    requiresOpHook: raw.required_op_hook,
    _raw: raw,
  }
}

/**
 * Normalize operations array (display-only; originals preserved in _raw).
 */
function normalizeOperations(raw: RawOperation[]): RouteOperation[] {
  return raw.map((op): RouteOperation => {
    const type = op.type ?? op.op_type
    switch (type) {
      case 'transfer':
        return {
          type: 'transfer',
          chainId: op.chain_id ?? '',
          channel: op.channel ?? '',
          denomIn: op.denom_in ?? '',
          denomOut: op.denom_out ?? '',
        }
      case 'swap':
        return {
          type: 'swap',
          poolId: op.pool_id ?? '',
          denomIn: op.denom_in ?? '',
          denomOut: op.denom_out ?? '',
        }
      default:
        return {
          type: type as RouteOperation['type'],
          denomIn: op.denom_in ?? '',
          denomOut: op.denom_out ?? '',
        } as RouteOperation
    }
  })
}

/**
 * Normalize transfer transactions response.
 * Converts base64-encoded proto messages to SDK Message format.
 */
function normalizeTransferTxs(raw: RawTransferTxsResponse): TransferTx[] {
  const txs = raw.txs ?? raw.msgs ?? []
  return txs.map(
    (tx): TransferTx => ({
      chainId: tx.chain_id ?? tx.cosmos_tx?.chain_id ?? tx.evm_tx?.chain_id ?? '',
      cosmosMsgs: normalizeCosmosMsgs(tx.cosmos_tx?.msgs),
      evmTx: tx.evm_tx
        ? { to: tx.evm_tx.to, data: tx.evm_tx.data, value: tx.evm_tx.value }
        : undefined,
      signerAddress:
        tx.signer_address ?? tx.cosmos_tx?.signer_address ?? tx.evm_tx?.signer_address ?? '',
    })
  )
}

/**
 * Convert router API message format to SDK Message format.
 * Router API returns { msg_type_url, msg } where msg is base64-encoded protobuf bytes.
 */
function normalizeCosmosMsgs(
  msgs: Array<{ msg_type_url: string; msg: string }> | undefined
): Message[] | undefined {
  if (!msgs?.length) return undefined
  return msgs.map(m =>
    Message.fromAny(
      create(AnySchema, {
        typeUrl: m.msg_type_url,
        value: base64ToUint8Array(m.msg),
      })
    )
  )
}

function normalizeOpHookResponse(raw: RawOpHookResponse): OpHookResult {
  return {
    chainId: raw.chain_id,
    hook: raw.hook,
  }
}

function normalizeStatus(raw: RawStatusResponse): TransferStatus {
  return {
    status: raw.status,
    txHash: raw.tx_hash,
  }
}
