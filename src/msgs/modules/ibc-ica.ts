import type { DescMessage } from '@bufbuild/protobuf'
import {
  MsgRegisterInterchainAccountSchema,
  MsgSendTxSchema,
  MsgUpdateParamsSchema as MsgControllerUpdateParamsSchema,
} from '@buf/cosmos_ibc.bufbuild_es/ibc/applications/interchain_accounts/controller/v1/tx_pb'
import { MsgUpdateParamsSchema as MsgHostUpdateParamsSchema } from '@buf/cosmos_ibc.bufbuild_es/ibc/applications/interchain_accounts/host/v1/tx_pb'
import { msg, type FriendlyInit, type Message } from '../types'

export interface IbcIcaModule {
  registerInterchainAccount(
    init: FriendlyInit<typeof MsgRegisterInterchainAccountSchema>
  ): Message<typeof MsgRegisterInterchainAccountSchema>
  sendTx(init: FriendlyInit<typeof MsgSendTxSchema>): Message<typeof MsgSendTxSchema>
  controllerUpdateParams(
    init: FriendlyInit<typeof MsgControllerUpdateParamsSchema>
  ): Message<typeof MsgControllerUpdateParamsSchema>
  hostUpdateParams(
    init: FriendlyInit<typeof MsgHostUpdateParamsSchema>
  ): Message<typeof MsgHostUpdateParamsSchema>
}

export const ibcIcaSchemas: DescMessage[] = [
  MsgRegisterInterchainAccountSchema,
  MsgSendTxSchema,
  MsgControllerUpdateParamsSchema,
  MsgHostUpdateParamsSchema,
]

export const ibcIcaModule: IbcIcaModule = {
  registerInterchainAccount: init => msg(MsgRegisterInterchainAccountSchema, init),
  sendTx: init => msg(MsgSendTxSchema, init),
  controllerUpdateParams: init => msg(MsgControllerUpdateParamsSchema, init),
  hostUpdateParams: init => msg(MsgHostUpdateParamsSchema, init),
}
