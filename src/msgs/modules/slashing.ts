import type { DescMessage } from '@bufbuild/protobuf'
import {
  MsgUnjailSchema,
  MsgUpdateParamsSchema,
} from '@initia/initia-proto/cosmos/slashing/v1beta1/tx_pb'
import { msg, type FriendlyInit, type Message } from '../types'

export interface SlashingModule {
  unjail(init: FriendlyInit<typeof MsgUnjailSchema>): Message<typeof MsgUnjailSchema>
  updateParams(
    init: FriendlyInit<typeof MsgUpdateParamsSchema>
  ): Message<typeof MsgUpdateParamsSchema>
}

export const slashingSchemas: DescMessage[] = [MsgUnjailSchema, MsgUpdateParamsSchema]

export const slashingModule: SlashingModule = {
  unjail: init => msg(MsgUnjailSchema, init),
  updateParams: init => msg(MsgUpdateParamsSchema, init),
}
