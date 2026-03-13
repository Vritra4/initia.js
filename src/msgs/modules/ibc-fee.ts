import type { DescMessage } from '@bufbuild/protobuf'
import {
  MsgRegisterPayeeSchema,
  MsgRegisterCounterpartyPayeeSchema,
  MsgPayPacketFeeSchema,
  MsgPayPacketFeeAsyncSchema,
} from '@initia/initia-proto/ibc/applications/fee/v1/tx_pb'
import { msg, type FriendlyInit, type Message } from '../types'

export interface IbcFeeModule {
  registerPayee(
    init: FriendlyInit<typeof MsgRegisterPayeeSchema>
  ): Message<typeof MsgRegisterPayeeSchema>
  registerCounterpartyPayee(
    init: FriendlyInit<typeof MsgRegisterCounterpartyPayeeSchema>
  ): Message<typeof MsgRegisterCounterpartyPayeeSchema>
  payPacketFee(
    init: FriendlyInit<typeof MsgPayPacketFeeSchema>
  ): Message<typeof MsgPayPacketFeeSchema>
  payPacketFeeAsync(
    init: FriendlyInit<typeof MsgPayPacketFeeAsyncSchema>
  ): Message<typeof MsgPayPacketFeeAsyncSchema>
}

export const ibcFeeSchemas: DescMessage[] = [
  MsgRegisterPayeeSchema,
  MsgRegisterCounterpartyPayeeSchema,
  MsgPayPacketFeeSchema,
  MsgPayPacketFeeAsyncSchema,
]

export const ibcFeeModule: IbcFeeModule = {
  registerPayee: init => msg(MsgRegisterPayeeSchema, init),
  registerCounterpartyPayee: init => msg(MsgRegisterCounterpartyPayeeSchema, init),
  payPacketFee: init => msg(MsgPayPacketFeeSchema, init),
  payPacketFeeAsync: init => msg(MsgPayPacketFeeAsyncSchema, init),
}
