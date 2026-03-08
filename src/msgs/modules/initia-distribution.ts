import type { DescMessage } from '@bufbuild/protobuf'
import {
  MsgUpdateParamsSchema,
  MsgDepositValidatorRewardsPoolSchema,
} from '@buf/initia-labs_initia.bufbuild_es/initia/distribution/v1/tx_pb'
import { msg, type FriendlyInit, type Message } from '../types'

export interface InitiaDistributionModule {
  updateParams(
    init: FriendlyInit<typeof MsgUpdateParamsSchema>
  ): Message<typeof MsgUpdateParamsSchema>
  depositValidatorRewardsPool(
    init: FriendlyInit<typeof MsgDepositValidatorRewardsPoolSchema>
  ): Message<typeof MsgDepositValidatorRewardsPoolSchema>
}

export const initiaDistributionSchemas: DescMessage[] = [
  MsgUpdateParamsSchema,
  MsgDepositValidatorRewardsPoolSchema,
]

export const initiaDistributionModule: InitiaDistributionModule = {
  updateParams: init => msg(MsgUpdateParamsSchema, init),
  depositValidatorRewardsPool: init => msg(MsgDepositValidatorRewardsPoolSchema, init),
}
