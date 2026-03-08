import type { DescMessage } from '@bufbuild/protobuf'
import { MsgUpdateParamsSchema } from '@buf/initia-labs_initia.bufbuild_es/initia/reward/v1/tx_pb'
import { msg, type FriendlyInit, type Message } from '../types'

export interface RewardModule {
  updateParams(
    init: FriendlyInit<typeof MsgUpdateParamsSchema>
  ): Message<typeof MsgUpdateParamsSchema>
}

export const rewardSchemas: DescMessage[] = [MsgUpdateParamsSchema]

export const rewardModule: RewardModule = {
  updateParams: init => msg(MsgUpdateParamsSchema, init),
}
