import type { DescMessage } from '@bufbuild/protobuf'
import {
  MsgCreateGroupSchema,
  MsgUpdateGroupMembersSchema,
  MsgUpdateGroupAdminSchema,
  MsgUpdateGroupMetadataSchema,
  MsgCreateGroupPolicySchema,
  MsgCreateGroupWithPolicySchema,
  MsgUpdateGroupPolicyAdminSchema,
  MsgUpdateGroupPolicyDecisionPolicySchema,
  MsgUpdateGroupPolicyMetadataSchema,
  MsgSubmitProposalSchema,
  MsgWithdrawProposalSchema,
  MsgVoteSchema,
  MsgExecSchema,
  MsgLeaveGroupSchema,
} from '@initia/initia-proto/cosmos/group/v1/tx_pb'
import { msg, msgWithDefaults, type FriendlyInit, type Message, type WithDefaults } from '../types'

export interface GroupModule {
  createGroup(
    init: WithDefaults<FriendlyInit<typeof MsgCreateGroupSchema>, 'metadata'>
  ): Message<typeof MsgCreateGroupSchema>
  updateGroupMembers(
    init: FriendlyInit<typeof MsgUpdateGroupMembersSchema>
  ): Message<typeof MsgUpdateGroupMembersSchema>
  updateGroupAdmin(
    init: FriendlyInit<typeof MsgUpdateGroupAdminSchema>
  ): Message<typeof MsgUpdateGroupAdminSchema>
  updateGroupMetadata(
    init: FriendlyInit<typeof MsgUpdateGroupMetadataSchema>
  ): Message<typeof MsgUpdateGroupMetadataSchema>
  createGroupPolicy(
    init: WithDefaults<FriendlyInit<typeof MsgCreateGroupPolicySchema>, 'metadata'>
  ): Message<typeof MsgCreateGroupPolicySchema>
  createGroupWithPolicy(
    init: WithDefaults<
      FriendlyInit<typeof MsgCreateGroupWithPolicySchema>,
      'groupMetadata' | 'groupPolicyMetadata' | 'groupPolicyAsAdmin'
    >
  ): Message<typeof MsgCreateGroupWithPolicySchema>
  updateGroupPolicyAdmin(
    init: FriendlyInit<typeof MsgUpdateGroupPolicyAdminSchema>
  ): Message<typeof MsgUpdateGroupPolicyAdminSchema>
  updateGroupPolicyDecisionPolicy(
    init: FriendlyInit<typeof MsgUpdateGroupPolicyDecisionPolicySchema>
  ): Message<typeof MsgUpdateGroupPolicyDecisionPolicySchema>
  updateGroupPolicyMetadata(
    init: FriendlyInit<typeof MsgUpdateGroupPolicyMetadataSchema>
  ): Message<typeof MsgUpdateGroupPolicyMetadataSchema>
  submitProposal(
    // title and summary are intentionally required — group proposals
    // must have meaningful content. Only metadata and exec are defaulted.
    init: WithDefaults<FriendlyInit<typeof MsgSubmitProposalSchema>, 'metadata' | 'exec'>
  ): Message<typeof MsgSubmitProposalSchema>
  withdrawProposal(
    init: FriendlyInit<typeof MsgWithdrawProposalSchema>
  ): Message<typeof MsgWithdrawProposalSchema>
  vote(
    init: WithDefaults<FriendlyInit<typeof MsgVoteSchema>, 'metadata' | 'exec'>
  ): Message<typeof MsgVoteSchema>
  exec(init: FriendlyInit<typeof MsgExecSchema>): Message<typeof MsgExecSchema>
  leaveGroup(init: FriendlyInit<typeof MsgLeaveGroupSchema>): Message<typeof MsgLeaveGroupSchema>
}

export const groupSchemas: DescMessage[] = [
  MsgCreateGroupSchema,
  MsgUpdateGroupMembersSchema,
  MsgUpdateGroupAdminSchema,
  MsgUpdateGroupMetadataSchema,
  MsgCreateGroupPolicySchema,
  MsgCreateGroupWithPolicySchema,
  MsgUpdateGroupPolicyAdminSchema,
  MsgUpdateGroupPolicyDecisionPolicySchema,
  MsgUpdateGroupPolicyMetadataSchema,
  MsgSubmitProposalSchema,
  MsgWithdrawProposalSchema,
  MsgVoteSchema,
  MsgExecSchema,
  MsgLeaveGroupSchema,
]

export const groupModule: GroupModule = {
  createGroup: init => msgWithDefaults(MsgCreateGroupSchema, { metadata: '' }, init),
  updateGroupMembers: init => msg(MsgUpdateGroupMembersSchema, init),
  updateGroupAdmin: init => msg(MsgUpdateGroupAdminSchema, init),
  updateGroupMetadata: init => msg(MsgUpdateGroupMetadataSchema, init),
  createGroupPolicy: init => msgWithDefaults(MsgCreateGroupPolicySchema, { metadata: '' }, init),
  createGroupWithPolicy: init =>
    msgWithDefaults(
      MsgCreateGroupWithPolicySchema,
      { groupMetadata: '', groupPolicyMetadata: '', groupPolicyAsAdmin: false },
      init
    ),
  updateGroupPolicyAdmin: init => msg(MsgUpdateGroupPolicyAdminSchema, init),
  updateGroupPolicyDecisionPolicy: init => msg(MsgUpdateGroupPolicyDecisionPolicySchema, init),
  updateGroupPolicyMetadata: init => msg(MsgUpdateGroupPolicyMetadataSchema, init),
  submitProposal: init => msgWithDefaults(MsgSubmitProposalSchema, { metadata: '', exec: 0 }, init),
  withdrawProposal: init => msg(MsgWithdrawProposalSchema, init),
  vote: init => msgWithDefaults(MsgVoteSchema, { metadata: '', exec: 0 }, init),
  exec: init => msg(MsgExecSchema, init),
  leaveGroup: init => msg(MsgLeaveGroupSchema, init),
}
