import { createBaseConfig } from './common'
import { Query as WasmQuery } from '@initia/miniwasm-proto/cosmwasm/wasm/v1/query_pb'
import { Msg as WasmTxMsg } from '@initia/miniwasm-proto/cosmwasm/wasm/v1/tx_pb'
import { Query as OpchildQuery } from '@initia/opinit-proto/opinit/opchild/v1/query_pb'
import { Msg as OpchildTxMsg } from '@initia/opinit-proto/opinit/opchild/v1/tx_pb'

export const miniwasmChain = createBaseConfig()
  .addModule('wasm', { query: WasmQuery, tx: WasmTxMsg })
  .addModule('opchild', { query: OpchildQuery, tx: OpchildTxMsg })
