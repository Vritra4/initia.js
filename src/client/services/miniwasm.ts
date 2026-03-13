/**
 * Miniwasm rollup services.
 *
 * Includes:
 * - Common: auth, bank, tx, tendermint
 * - Miniwasm-specific: wasm, opchild
 *
 * Source imports: @initia/initia-proto, @initia/miniwasm-proto, @initia/opinit-proto (opchild)
 */

import { createCommonRegistry } from './common'

// CosmWasm services
import { Query as WasmQuery } from '@initia/miniwasm-proto/cosmwasm/wasm/v1/query_pb'

// OPinit child
import { Query as OpchildQuery } from '@initia/opinit-proto/opinit/opchild/v1/query_pb'

// Miniwasm Msg types
import { file_cosmwasm_wasm_v1_tx } from '@initia/miniwasm-proto/cosmwasm/wasm/v1/tx_pb'
import { file_opinit_opchild_v1_tx } from '@initia/opinit-proto/opinit/opchild/v1/tx_pb'

export const MiniwasmServices = createCommonRegistry()
  .addModule('wasm', WasmQuery, file_cosmwasm_wasm_v1_tx)
  .addModule('opchild', OpchildQuery, file_opinit_opchild_v1_tx)
