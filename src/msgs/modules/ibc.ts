import type { DescMessage } from '@bufbuild/protobuf'
import {
  MsgTransferSchema,
  MsgUpdateParamsSchema,
} from '@initia/initia-proto/ibc/applications/transfer/v1/tx_pb'
import {
  msg,
  msgWithDefaults,
  type FriendlyInit,
  type Message,
  type WithDefaults,
  defaultTimeout,
} from '../types'

export interface IbcModule {
  transfer(
    init: WithDefaults<
      FriendlyInit<typeof MsgTransferSchema>,
      'sourcePort' | 'timeoutTimestamp' | 'timeoutHeight' | 'memo'
    >
  ): Message<typeof MsgTransferSchema>
  updateParams(
    init: FriendlyInit<typeof MsgUpdateParamsSchema>
  ): Message<typeof MsgUpdateParamsSchema>
}

export const ibcSchemas: DescMessage[] = [MsgTransferSchema, MsgUpdateParamsSchema]

export const ibcModule: IbcModule = {
  transfer: init =>
    msgWithDefaults(
      MsgTransferSchema,
      { sourcePort: 'transfer', timeoutTimestamp: defaultTimeout(), memo: '' },
      init
    ),
  updateParams: init => msg(MsgUpdateParamsSchema, init),
}
