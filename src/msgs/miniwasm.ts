/**
 * Miniwasm rollup message composition.
 */

import type { MiniwasmMsgs, WithSchemas } from './types'
import { msgCustom } from './types'
import { createDecode } from './decode'

import { bankModule, bankSchemas } from './modules/bank'
import { ibcModule, ibcSchemas } from './modules/ibc'
import { wasmModule, wasmSchemas } from './modules/wasm'
import { opchildModule, opchildSchemas } from './modules/opchild'

const allSchemas = [...bankSchemas, ...ibcSchemas, ...wasmSchemas, ...opchildSchemas]

export const miniwasmMsgs: WithSchemas<MiniwasmMsgs> = {
  bank: bankModule,
  ibc: ibcModule,
  wasm: wasmModule,
  opchild: opchildModule,
  custom: msgCustom,
  decode: createDecode(allSchemas),
  _schemas: allSchemas,
}
