import type { DescMessage } from '@bufbuild/protobuf'
import {
  MsgSendSchema,
  MsgMultiSendSchema,
  MsgUpdateParamsSchema,
  MsgSetSendEnabledSchema,
} from '@initia/initia-proto/cosmos/bank/v1beta1/tx_pb'
import { msg, type FriendlyInit, type Message } from '../types'

export interface BankModule {
  send(init: FriendlyInit<typeof MsgSendSchema>): Message<typeof MsgSendSchema>
  multiSend(init: FriendlyInit<typeof MsgMultiSendSchema>): Message<typeof MsgMultiSendSchema>
  updateParams(
    init: FriendlyInit<typeof MsgUpdateParamsSchema>
  ): Message<typeof MsgUpdateParamsSchema>
  setSendEnabled(
    init: FriendlyInit<typeof MsgSetSendEnabledSchema>
  ): Message<typeof MsgSetSendEnabledSchema>
}

export const bankSchemas: DescMessage[] = [
  MsgSendSchema,
  MsgMultiSendSchema,
  MsgUpdateParamsSchema,
  MsgSetSendEnabledSchema,
]

export const bankModule: BankModule = {
  send: init => msg(MsgSendSchema, init),
  multiSend: init => msg(MsgMultiSendSchema, init),
  updateParams: init => msg(MsgUpdateParamsSchema, init),
  setSendEnabled: init => msg(MsgSetSendEnabledSchema, init),
}
