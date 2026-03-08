import type { DescMessage } from '@bufbuild/protobuf'
import {
  MsgSetWithdrawAddressSchema,
  MsgWithdrawDelegatorRewardSchema,
  MsgWithdrawValidatorCommissionSchema,
  MsgFundCommunityPoolSchema,
  MsgUpdateParamsSchema,
  MsgCommunityPoolSpendSchema,
  MsgDepositValidatorRewardsPoolSchema,
} from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/distribution/v1beta1/tx_pb'
import { msg, type FriendlyInit, type Message } from '../types'

export interface DistributionModule {
  setWithdrawAddress(
    init: FriendlyInit<typeof MsgSetWithdrawAddressSchema>
  ): Message<typeof MsgSetWithdrawAddressSchema>
  withdrawDelegatorReward(
    init: FriendlyInit<typeof MsgWithdrawDelegatorRewardSchema>
  ): Message<typeof MsgWithdrawDelegatorRewardSchema>
  withdrawValidatorCommission(
    init: FriendlyInit<typeof MsgWithdrawValidatorCommissionSchema>
  ): Message<typeof MsgWithdrawValidatorCommissionSchema>
  fundCommunityPool(
    init: FriendlyInit<typeof MsgFundCommunityPoolSchema>
  ): Message<typeof MsgFundCommunityPoolSchema>
  updateParams(
    init: FriendlyInit<typeof MsgUpdateParamsSchema>
  ): Message<typeof MsgUpdateParamsSchema>
  communityPoolSpend(
    init: FriendlyInit<typeof MsgCommunityPoolSpendSchema>
  ): Message<typeof MsgCommunityPoolSpendSchema>
  depositValidatorRewardsPool(
    init: FriendlyInit<typeof MsgDepositValidatorRewardsPoolSchema>
  ): Message<typeof MsgDepositValidatorRewardsPoolSchema>
}

export const distributionSchemas: DescMessage[] = [
  MsgSetWithdrawAddressSchema,
  MsgWithdrawDelegatorRewardSchema,
  MsgWithdrawValidatorCommissionSchema,
  MsgFundCommunityPoolSchema,
  MsgUpdateParamsSchema,
  MsgCommunityPoolSpendSchema,
  MsgDepositValidatorRewardsPoolSchema,
]

export const distributionModule: DistributionModule = {
  setWithdrawAddress: init => msg(MsgSetWithdrawAddressSchema, init),
  withdrawDelegatorReward: init => msg(MsgWithdrawDelegatorRewardSchema, init),
  withdrawValidatorCommission: init => msg(MsgWithdrawValidatorCommissionSchema, init),
  fundCommunityPool: init => msg(MsgFundCommunityPoolSchema, init),
  updateParams: init => msg(MsgUpdateParamsSchema, init),
  communityPoolSpend: init => msg(MsgCommunityPoolSpendSchema, init),
  depositValidatorRewardsPool: init => msg(MsgDepositValidatorRewardsPoolSchema, init),
}
