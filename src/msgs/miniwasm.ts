/**
 * Miniwasm rollup message builders.
 *
 * Includes CosmWasm contract operations.
 */

import type { Numeric } from '../types'
import {
  MsgStoreCodeSchema,
  MsgInstantiateContractSchema,
  MsgExecuteContractSchema,
  MsgMigrateContractSchema,
} from '@buf/cosmwasm_wasmd.bufbuild_es/cosmwasm/wasm/v1/tx_pb'

import type { Coin } from '../core/coin'
import { Message, type MiniwasmMsgs } from './types'
import { baseMsgs, toProtoCoins } from './base'
import { encodeMsg } from '../util/json'

/**
 * Store wasm bytecode on chain.
 */
function storeCode(sender: string, wasmByteCode: Uint8Array): Message<typeof MsgStoreCodeSchema> {
  return new Message(MsgStoreCodeSchema, {
    sender,
    wasmByteCode,
  })
}

/**
 * Instantiate a new CosmWasm contract.
 */
function instantiate(
  sender: string,
  codeId: Numeric,
  msg: object,
  label: string,
  funds?: Coin[]
): Message<typeof MsgInstantiateContractSchema> {
  return new Message(MsgInstantiateContractSchema, {
    sender,
    admin: '', // No admin by default
    codeId: BigInt(codeId),
    label,
    msg: encodeMsg(msg),
    funds: toProtoCoins(funds),
  })
}

/**
 * Execute a CosmWasm contract method.
 */
function executeContract(
  sender: string,
  contract: string,
  msg: object,
  funds?: Coin[]
): Message<typeof MsgExecuteContractSchema> {
  return new Message(MsgExecuteContractSchema, {
    sender,
    contract,
    msg: encodeMsg(msg),
    funds: toProtoCoins(funds),
  })
}

/**
 * Migrate a CosmWasm contract to new code.
 */
function migrate(
  sender: string,
  contract: string,
  codeId: Numeric,
  msg: object
): Message<typeof MsgMigrateContractSchema> {
  return new Message(MsgMigrateContractSchema, {
    sender,
    contract,
    codeId: BigInt(codeId),
    msg: encodeMsg(msg),
  })
}

/**
 * Miniwasm rollup message builders instance.
 * Extends base messages with CosmWasm operations.
 */
export const miniwasmMsgs: MiniwasmMsgs = {
  // Base messages
  ...baseMsgs,

  // CosmWasm
  storeCode,
  instantiate,
  executeContract,
  migrate,
}
