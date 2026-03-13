import type { DescMessage } from '@bufbuild/protobuf'
import {
  MsgUpdateACLSchema,
  MsgUpdateParamsSchema,
} from '@initia/initia-proto/initia/ibchooks/v1/tx_pb'
import { msg, type FriendlyInit, type Message } from '../types'

export interface IbcHooksModule {
  updateACL(init: FriendlyInit<typeof MsgUpdateACLSchema>): Message<typeof MsgUpdateACLSchema>
  updateParams(
    init: FriendlyInit<typeof MsgUpdateParamsSchema>
  ): Message<typeof MsgUpdateParamsSchema>
}

export const ibcHooksSchemas: DescMessage[] = [MsgUpdateACLSchema, MsgUpdateParamsSchema]

export const ibcHooksModule: IbcHooksModule = {
  updateACL: init => msg(MsgUpdateACLSchema, init),
  updateParams: init => msg(MsgUpdateParamsSchema, init),
}
