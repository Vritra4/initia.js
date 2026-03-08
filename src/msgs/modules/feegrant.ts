import type { DescMessage } from '@bufbuild/protobuf'
import {
  MsgGrantAllowanceSchema,
  MsgRevokeAllowanceSchema,
  MsgPruneAllowancesSchema,
} from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/feegrant/v1beta1/tx_pb'
import { msg, type FriendlyInit, type Message } from '../types'

export interface FeegrantModule {
  grantAllowance(
    init: FriendlyInit<typeof MsgGrantAllowanceSchema>
  ): Message<typeof MsgGrantAllowanceSchema>
  revokeAllowance(
    init: FriendlyInit<typeof MsgRevokeAllowanceSchema>
  ): Message<typeof MsgRevokeAllowanceSchema>
  pruneAllowances(
    init: FriendlyInit<typeof MsgPruneAllowancesSchema>
  ): Message<typeof MsgPruneAllowancesSchema>
}

export const feegrantSchemas: DescMessage[] = [
  MsgGrantAllowanceSchema,
  MsgRevokeAllowanceSchema,
  MsgPruneAllowancesSchema,
]

export const feegrantModule: FeegrantModule = {
  grantAllowance: init => msg(MsgGrantAllowanceSchema, init),
  revokeAllowance: init => msg(MsgRevokeAllowanceSchema, init),
  pruneAllowances: init => msg(MsgPruneAllowancesSchema, init),
}
