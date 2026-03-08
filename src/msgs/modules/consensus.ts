import type { DescMessage } from '@bufbuild/protobuf'
import { MsgUpdateParamsSchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/consensus/v1/tx_pb'
import { msg, type FriendlyInit, type Message } from '../types'

export interface ConsensusModule {
  updateParams(
    init: FriendlyInit<typeof MsgUpdateParamsSchema>
  ): Message<typeof MsgUpdateParamsSchema>
}

export const consensusSchemas: DescMessage[] = [MsgUpdateParamsSchema]

export const consensusModule: ConsensusModule = {
  updateParams: init => msg(MsgUpdateParamsSchema, init),
}
