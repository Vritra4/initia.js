/**
 * Minimove rollup message builders.
 *
 * Includes Move VM execution messages only.
 * Minimove uses the same Move VM as Initia L1.
 */

import {
  MsgExecuteSchema,
  MsgScriptSchema,
} from '@buf/initia-labs_initia.bufbuild_es/initia/move/v1/tx_pb'

import { Message, type MinimoveMsgs, type MoveExecuteInput } from './types'
import { baseMsgs } from './base'

/**
 * Execute a Move function.
 * Accepts positional args or an object: `execute({ sender, moduleAddress, moduleName, functionName, typeArgs, args })`.
 */
function execute(
  senderOrInput: string | MoveExecuteInput,
  moduleAddress?: string,
  moduleName?: string,
  functionName?: string,
  typeArgs?: string[],
  args?: Uint8Array[]
): Message<typeof MsgExecuteSchema> {
  if (typeof senderOrInput !== 'string') {
    return new Message(MsgExecuteSchema, senderOrInput)
  }
  return new Message(MsgExecuteSchema, {
    sender: senderOrInput,
    moduleAddress: moduleAddress!,
    moduleName: moduleName!,
    functionName: functionName!,
    typeArgs: typeArgs!,
    args: args!,
  })
}

/**
 * Execute a Move script.
 */
function script(
  sender: string,
  codeBytes: Uint8Array,
  typeArgs: string[],
  args: Uint8Array[]
): Message<typeof MsgScriptSchema> {
  return new Message(MsgScriptSchema, {
    sender,
    codeBytes,
    typeArgs,
    args,
  })
}

/**
 * Minimove rollup message builders instance.
 * Extends base messages with Move VM execution.
 */
export const minimoveMsgs: MinimoveMsgs = {
  // Base messages
  ...baseMsgs,

  // Move
  execute,
  script,
}
