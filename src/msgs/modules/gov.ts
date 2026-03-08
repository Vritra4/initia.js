import type { DescMessage } from '@bufbuild/protobuf'
import {
  MsgSubmitProposalSchema,
  MsgExecLegacyContentSchema,
  MsgVoteSchema,
  MsgVoteWeightedSchema,
  MsgDepositSchema,
  MsgUpdateParamsSchema,
  MsgCancelProposalSchema,
} from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/gov/v1/tx_pb'
import { msg, msgWithDefaults, type FriendlyInit, type Message, type WithDefaults } from '../types'

export interface GovModule {
  submitProposal(
    // title and summary are intentionally required — governance proposals
    // must have meaningful content. Only metadata and expedited are defaulted.
    init: WithDefaults<FriendlyInit<typeof MsgSubmitProposalSchema>, 'metadata' | 'expedited'>
  ): Message<typeof MsgSubmitProposalSchema>
  execLegacyContent(
    init: FriendlyInit<typeof MsgExecLegacyContentSchema>
  ): Message<typeof MsgExecLegacyContentSchema>
  vote(
    init: WithDefaults<FriendlyInit<typeof MsgVoteSchema>, 'metadata'>
  ): Message<typeof MsgVoteSchema>
  voteWeighted(
    init: WithDefaults<FriendlyInit<typeof MsgVoteWeightedSchema>, 'metadata'>
  ): Message<typeof MsgVoteWeightedSchema>
  deposit(init: FriendlyInit<typeof MsgDepositSchema>): Message<typeof MsgDepositSchema>
  updateParams(
    init: FriendlyInit<typeof MsgUpdateParamsSchema>
  ): Message<typeof MsgUpdateParamsSchema>
  cancelProposal(
    init: FriendlyInit<typeof MsgCancelProposalSchema>
  ): Message<typeof MsgCancelProposalSchema>
}

export const govSchemas: DescMessage[] = [
  MsgSubmitProposalSchema,
  MsgExecLegacyContentSchema,
  MsgVoteSchema,
  MsgVoteWeightedSchema,
  MsgDepositSchema,
  MsgUpdateParamsSchema,
  MsgCancelProposalSchema,
]

export const govModule: GovModule = {
  submitProposal: init =>
    msgWithDefaults(MsgSubmitProposalSchema, { metadata: '', expedited: false }, init),
  execLegacyContent: init => msg(MsgExecLegacyContentSchema, init),
  vote: init => msgWithDefaults(MsgVoteSchema, { metadata: '' }, init),
  voteWeighted: init => msgWithDefaults(MsgVoteWeightedSchema, { metadata: '' }, init),
  deposit: init => msg(MsgDepositSchema, init),
  updateParams: init => msg(MsgUpdateParamsSchema, init),
  cancelProposal: init => msg(MsgCancelProposalSchema, init),
}
