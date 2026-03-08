import type { DescMessage } from '@bufbuild/protobuf'
import {
  MsgGrantSchema,
  MsgExecSchema,
  MsgRevokeSchema,
} from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/authz/v1beta1/tx_pb'
import { msg, type FriendlyInit, type Message } from '../types'

export interface AuthzModule {
  grant(init: FriendlyInit<typeof MsgGrantSchema>): Message<typeof MsgGrantSchema>
  exec(init: FriendlyInit<typeof MsgExecSchema>): Message<typeof MsgExecSchema>
  revoke(init: FriendlyInit<typeof MsgRevokeSchema>): Message<typeof MsgRevokeSchema>
}

export const authzSchemas: DescMessage[] = [MsgGrantSchema, MsgExecSchema, MsgRevokeSchema]

export const authzModule: AuthzModule = {
  grant: init => msg(MsgGrantSchema, init),
  exec: init => msg(MsgExecSchema, init),
  revoke: init => msg(MsgRevokeSchema, init),
}
