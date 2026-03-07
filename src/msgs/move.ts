/**
 * Shared Move VM message builders.
 *
 * Used by both initia (L1) and minimove (L2) message sets.
 */

import {
  MsgExecuteSchema,
  MsgScriptSchema,
} from '@buf/initia-labs_initia.bufbuild_es/initia/move/v1/tx_pb'

import { Message, type MoveExecuteInput } from './types'

/**
 * Execute a Move function.
 * Accepts positional args or an object: `execute({ sender, moduleAddress, moduleName, functionName, typeArgs, args })`.
 */
export function execute(
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
export function script(
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
