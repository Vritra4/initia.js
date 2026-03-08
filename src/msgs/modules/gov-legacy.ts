import type { DescMessage } from '@bufbuild/protobuf'
import {
  MsgSubmitProposalSchema,
  MsgVoteSchema,
  MsgVoteWeightedSchema,
  MsgDepositSchema,
} from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/gov/v1beta1/tx_pb'
import { msg, type FriendlyInit, type Message } from '../types'

export interface GovLegacyModule {
  submitProposal(
    init: FriendlyInit<typeof MsgSubmitProposalSchema>
  ): Message<typeof MsgSubmitProposalSchema>
  vote(init: FriendlyInit<typeof MsgVoteSchema>): Message<typeof MsgVoteSchema>
  voteWeighted(
    init: FriendlyInit<typeof MsgVoteWeightedSchema>
  ): Message<typeof MsgVoteWeightedSchema>
  deposit(init: FriendlyInit<typeof MsgDepositSchema>): Message<typeof MsgDepositSchema>
}

export const govLegacySchemas: DescMessage[] = [
  MsgSubmitProposalSchema,
  MsgVoteSchema,
  MsgVoteWeightedSchema,
  MsgDepositSchema,
]

export const govLegacyModule: GovLegacyModule = {
  submitProposal: init => msg(MsgSubmitProposalSchema, init),
  vote: init => msg(MsgVoteSchema, init),
  voteWeighted: init => msg(MsgVoteWeightedSchema, init),
  deposit: init => msg(MsgDepositSchema, init),
}
