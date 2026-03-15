import { createBaseConfig } from './common'
import { Query as MoveQuery } from '@initia/initia-proto/initia/move/v1/query_pb'
import { Msg as MoveTxMsg } from '@initia/initia-proto/initia/move/v1/tx_pb'
import { Query as OpchildQuery } from '@initia/opinit-proto/opinit/opchild/v1/query_pb'
import { Msg as OpchildTxMsg } from '@initia/opinit-proto/opinit/opchild/v1/tx_pb'

export const minimoveChain = createBaseConfig()
  .addModule('move', { query: MoveQuery, tx: MoveTxMsg })
  .addModule('opchild', { query: OpchildQuery, tx: OpchildTxMsg })
