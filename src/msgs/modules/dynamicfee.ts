import type { DescMessage } from '@bufbuild/protobuf'
import { MsgUpdateParamsSchema } from '@initia/initia-proto/initia/dynamicfee/v1/tx_pb'
import { msg, type FriendlyInit, type Message } from '../types'

export interface DynamicFeeModule {
  updateParams(
    init: FriendlyInit<typeof MsgUpdateParamsSchema>
  ): Message<typeof MsgUpdateParamsSchema>
}

export const dynamicFeeSchemas: DescMessage[] = [MsgUpdateParamsSchema]

export const dynamicFeeModule: DynamicFeeModule = {
  updateParams: init => msg(MsgUpdateParamsSchema, init),
}
