import type { DescMessage } from '@bufbuild/protobuf'
import { MsgUpdateParamsSchema } from '@initia/initia-proto/cosmos/auth/v1beta1/tx_pb'
import { msg, type FriendlyInit, type Message } from '../types'

export interface AuthModule {
  updateParams(
    init: FriendlyInit<typeof MsgUpdateParamsSchema>
  ): Message<typeof MsgUpdateParamsSchema>
}

export const authSchemas: DescMessage[] = [MsgUpdateParamsSchema]

export const authModule: AuthModule = {
  updateParams: init => msg(MsgUpdateParamsSchema, init),
}
