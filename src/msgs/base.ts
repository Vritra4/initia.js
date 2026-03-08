/**
 * Base message composition for generic Cosmos chains.
 *
 * Only includes bank and ibc domain modules (plus custom() and decode() from CoreModules).
 */

import type { BaseMsgs, WithSchemas } from './types'
import { msgCustom } from './types'
import { createDecode } from './decode'

import { bankModule, bankSchemas } from './modules/bank'
import { ibcModule, ibcSchemas } from './modules/ibc'

const allSchemas = [...bankSchemas, ...ibcSchemas]

export const baseMsgs: WithSchemas<BaseMsgs> = {
  bank: bankModule,
  ibc: ibcModule,
  custom: msgCustom,
  decode: createDecode(allSchemas),
  _schemas: allSchemas,
}
