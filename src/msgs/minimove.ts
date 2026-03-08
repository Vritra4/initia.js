/**
 * Minimove rollup message composition.
 */

import type { MinimoveMsgs, WithSchemas } from './types'
import { msgCustom } from './types'
import { createDecode } from './decode'

import { bankModule, bankSchemas } from './modules/bank'
import { ibcModule, ibcSchemas } from './modules/ibc'
import { moveModule, moveSchemas } from './modules/move'
import { opchildModule, opchildSchemas } from './modules/opchild'

const allSchemas = [...bankSchemas, ...ibcSchemas, ...moveSchemas, ...opchildSchemas]

export const minimoveMsgs: WithSchemas<MinimoveMsgs> = {
  bank: bankModule,
  ibc: ibcModule,
  move: moveModule,
  opchild: opchildModule,
  custom: msgCustom,
  decode: createDecode(allSchemas),
  _schemas: allSchemas,
}
