/**
 * Base message builders for all chains.
 *
 * These are common messages available on every chain type:
 * - send: Bank transfer within same chain
 * - transfer: IBC transfer to another chain
 * - custom: Any protobuf message
 */

import { create } from '@bufbuild/protobuf'
import type { DescMessage, MessageInitShape } from '@bufbuild/protobuf'
import { MsgSendSchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/bank/v1beta1/tx_pb'
import { CoinSchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/base/v1beta1/coin_pb'
import { MsgTransferSchema } from '@buf/cosmos_ibc.bufbuild_es/ibc/applications/transfer/v1/tx_pb'
import { HeightSchema } from '@buf/cosmos_ibc.bufbuild_es/ibc/core/client/v1/client_pb'
import type { Coin } from '../core/coin'
import {
  Message,
  type BaseMsgs,
  type IbcTransferOptions,
  type SendInput,
  type TransferInput,
} from './types'

/**
 * Convert a single SDK Coin to protobuf Coin format.
 */
export function toProtoCoin(coin: Coin) {
  return create(CoinSchema, {
    denom: coin.denom,
    amount: coin.amount,
  })
}

/**
 * Convert SDK Coin(s) to protobuf Coin array.
 * Accepts a single Coin, Coin[], or undefined (returns []).
 */
export function toProtoCoins(amount?: Coin | Coin[]) {
  if (!amount) return []
  const coins = Array.isArray(amount) ? amount : [amount]
  return coins.map(toProtoCoin)
}

/**
 * Create a MsgSend for bank transfer.
 * Accepts positional args or an object: `send({ from, to, amount })`.
 */
function send(
  fromOrInput: string | SendInput,
  to?: string,
  amount?: Coin | Coin[]
): Message<typeof MsgSendSchema> {
  if (typeof fromOrInput !== 'string') {
    return new Message(MsgSendSchema, {
      fromAddress: fromOrInput.from,
      toAddress: fromOrInput.to,
      amount: toProtoCoins(fromOrInput.amount),
    })
  }
  return new Message(MsgSendSchema, {
    fromAddress: fromOrInput,
    toAddress: to!,
    amount: toProtoCoins(amount),
  })
}

/**
 * Create a MsgTransfer for IBC transfer.
 * Accepts positional args or an object: `transfer({ sender, receiver, token, channel, ...options })`.
 */
function transfer(
  senderOrInput: string | TransferInput,
  receiver?: string,
  token?: Coin,
  channel?: string,
  options?: IbcTransferOptions
): Message<typeof MsgTransferSchema> {
  let s: string, r: string, t: Coin, ch: string, opts: IbcTransferOptions | undefined
  if (typeof senderOrInput !== 'string') {
    const { sender: _s, receiver: _r, token: _t, channel: _ch, ...rest } = senderOrInput
    s = _s
    r = _r
    t = _t
    ch = _ch
    opts = rest
  } else {
    s = senderOrInput
    r = receiver!
    t = token!
    ch = channel!
    opts = options
  }

  // Default timeout: 10 minutes from now in nanoseconds
  const defaultTimeout = BigInt(Date.now() + 10 * 60 * 1000) * 1_000_000n

  return new Message(MsgTransferSchema, {
    sourcePort: opts?.sourcePort ?? 'transfer',
    sourceChannel: ch,
    token: toProtoCoin(t),
    sender: s,
    receiver: r,
    timeoutHeight: opts?.timeoutHeight
      ? create(HeightSchema, {
          revisionNumber: BigInt(opts.timeoutHeight.revisionNumber),
          revisionHeight: BigInt(opts.timeoutHeight.revisionHeight),
        })
      : create(HeightSchema, {
          revisionNumber: 0n,
          revisionHeight: 0n,
        }),
    timeoutTimestamp: BigInt(opts?.timeoutTimestamp ?? defaultTimeout),
    memo: opts?.memo ?? '',
  })
}

/**
 * Create a custom message from any protobuf schema.
 *
 * @param schema - Protobuf message descriptor
 * @param data - Message initialization data
 * @returns Packed Message
 */
function custom<T extends DescMessage>(schema: T, data: MessageInitShape<T>): Message<T> {
  return new Message(schema, data)
}

/**
 * Base message builders instance.
 * Available on all chain types.
 */
export const baseMsgs: BaseMsgs = {
  send,
  transfer,
  custom,
}
