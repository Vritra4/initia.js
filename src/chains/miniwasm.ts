import { createBaseConfig } from './common'
import { Query as WasmQuery } from '@buf/cosmwasm_wasmd.bufbuild_es/cosmwasm/wasm/v1/query_pb'
import { Msg as WasmTxMsg } from '@buf/cosmwasm_wasmd.bufbuild_es/cosmwasm/wasm/v1/tx_pb'
import { Query as OpchildQuery } from '@buf/initia-labs_opinit.bufbuild_es/opinit/opchild/v1/query_pb'
import { Msg as OpchildTxMsg } from '@buf/initia-labs_opinit.bufbuild_es/opinit/opchild/v1/tx_pb'

export const miniwasmChain = createBaseConfig()
  .addModule('wasm', { query: WasmQuery, tx: WasmTxMsg })
  .addModule('opchild', { query: OpchildQuery, tx: OpchildTxMsg })
