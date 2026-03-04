/**
 * Minievm rollup message builders.
 *
 * Includes EVM contract operations.
 */

import {
  MsgCreateSchema,
  MsgCallSchema,
} from '@buf/initia-labs_minievm.bufbuild_es/minievm/evm/v1/tx_pb'

import { bytesToHex } from '@noble/hashes/utils.js'
import { Message, type MinievmMsgs } from './types'
import { baseMsgs } from './base'

/**
 * Deploy a new EVM contract.
 *
 * @param sender - Sender address
 * @param code - Contract bytecode
 * @param value - Optional value to send (in wei, as string)
 * @returns Packed Any message
 */
function create_(
  sender: string,
  code: Uint8Array,
  value?: string
): Message<typeof MsgCreateSchema> {
  return new Message(MsgCreateSchema, {
    sender,
    code: bytesToHex(code),
    value: value ?? '0',
  })
}

/**
 * Call an EVM contract method.
 *
 * @param sender - Sender address
 * @param contractAddr - Contract address to call
 * @param input - ABI-encoded call data
 * @param value - Optional value to send (in wei, as string)
 * @returns Packed Any message
 */
function call(
  sender: string,
  contractAddr: string,
  input: Uint8Array,
  value?: string
): Message<typeof MsgCallSchema> {
  return new Message(MsgCallSchema, {
    sender,
    contractAddr,
    input: bytesToHex(input),
    value: value ?? '0',
  })
}

/**
 * Minievm rollup message builders instance.
 * Extends base messages with EVM operations.
 */
export const minievmMsgs: MinievmMsgs = {
  // Base messages
  ...baseMsgs,

  // EVM
  create: create_,
  call,
}
