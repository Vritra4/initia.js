/**
 * Miniwasm rollup services.
 *
 * Includes:
 * - Common: auth, bank, tx, tendermint
 * - Miniwasm-specific: wasm, opchild
 *
 * Source imports: @buf/cosmos_cosmos-sdk, @buf/cosmwasm_wasmd, @buf/initia-labs_opinit (opchild)
 */

import { createCommonRegistry } from './common'

// CosmWasm services
import { Query as WasmQuery } from '@buf/cosmwasm_wasmd.bufbuild_es/cosmwasm/wasm/v1/query_pb'

// OPinit child
import { Query as OpchildQuery } from '@buf/initia-labs_opinit.bufbuild_es/opinit/opchild/v1/query_pb'

export const MiniwasmServices = createCommonRegistry()
  .add('wasm', WasmQuery)
  .add('opchild', OpchildQuery)
