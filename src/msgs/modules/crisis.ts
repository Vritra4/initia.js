import type { DescMessage } from '@bufbuild/protobuf'
import {
  MsgVerifyInvariantSchema,
  MsgUpdateParamsSchema,
} from '@initia/initia-proto/cosmos/crisis/v1beta1/tx_pb'
import { msg, type FriendlyInit, type Message } from '../types'

export interface CrisisModule {
  verifyInvariant(
    init: FriendlyInit<typeof MsgVerifyInvariantSchema>
  ): Message<typeof MsgVerifyInvariantSchema>
  updateParams(
    init: FriendlyInit<typeof MsgUpdateParamsSchema>
  ): Message<typeof MsgUpdateParamsSchema>
}

export const crisisSchemas: DescMessage[] = [MsgVerifyInvariantSchema, MsgUpdateParamsSchema]

export const crisisModule: CrisisModule = {
  verifyInvariant: init => msg(MsgVerifyInvariantSchema, init),
  updateParams: init => msg(MsgUpdateParamsSchema, init),
}
