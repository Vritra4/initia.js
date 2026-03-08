/**
 * Minievm rollup message composition.
 */

import type { MinievmMsgs, WithSchemas } from './types'
import { msgCustom } from './types'
import { createDecode } from './decode'

import { bankModule, bankSchemas } from './modules/bank'
import { ibcModule, ibcSchemas } from './modules/ibc'
import { evmModule, evmSchemas } from './modules/evm'
import { opchildModule, opchildSchemas } from './modules/opchild'

const allSchemas = [...bankSchemas, ...ibcSchemas, ...evmSchemas, ...opchildSchemas]

export const minievmMsgs: WithSchemas<MinievmMsgs> = {
  bank: bankModule,
  ibc: ibcModule,
  evm: evmModule,
  opchild: opchildModule,
  custom: msgCustom,
  decode: createDecode(allSchemas),
  _schemas: allSchemas,
}
