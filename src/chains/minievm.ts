import { createBaseConfig } from './common'
import { Query as EvmQuery } from '@initia/minievm-proto/minievm/evm/v1/query_pb'
import { Msg as EvmTxMsg } from '@initia/minievm-proto/minievm/evm/v1/tx_pb'
import { Query as OpchildQuery } from '@initia/opinit-proto/opinit/opchild/v1/query_pb'
import { Msg as OpchildTxMsg } from '@initia/opinit-proto/opinit/opchild/v1/tx_pb'

export const minievmChain = createBaseConfig()
  .addModule('evm', { query: EvmQuery, tx: EvmTxMsg })
  .addModule('opchild', { query: OpchildQuery, tx: OpchildTxMsg })
