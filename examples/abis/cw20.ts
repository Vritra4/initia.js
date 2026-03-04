/**
 * Static CW20 contract schema for typed contract interactions.
 *
 * Extracted from the cw20-base contract JSON schema.
 * Only commonly-used variants are included for brevity.
 *
 * Usage:
 *   import { CW20_SCHEMA } from './abis/cw20'
 *   const cw20 = createWasmContract(ctx, addr, CW20_SCHEMA)
 *   cw20.execute.transfer(sender, { recipient: '...', amount: '1000' })
 *   cw20.query.balance({ address: '...' })
 */

import type { ReadonlyWasmContractSchema } from 'initia.js/wasm'

export const CW20_SCHEMA = {
  execute: {
    oneOf: [
      { required: ['transfer'] as const, properties: { transfer: {} } },
      { required: ['burn'] as const, properties: { burn: {} } },
      { required: ['send'] as const, properties: { send: {} } },
      { required: ['increase_allowance'] as const, properties: { increase_allowance: {} } },
      { required: ['decrease_allowance'] as const, properties: { decrease_allowance: {} } },
      { required: ['transfer_from'] as const, properties: { transfer_from: {} } },
      { required: ['mint'] as const, properties: { mint: {} } },
    ],
  },
  query: {
    oneOf: [
      { required: ['balance'] as const, properties: { balance: {} } },
      { required: ['token_info'] as const, properties: { token_info: {} } },
      { required: ['minter'] as const, properties: { minter: {} } },
      { required: ['allowance'] as const, properties: { allowance: {} } },
      { required: ['all_allowances'] as const, properties: { all_allowances: {} } },
      { required: ['all_accounts'] as const, properties: { all_accounts: {} } },
    ],
  },
} as const satisfies ReadonlyWasmContractSchema
