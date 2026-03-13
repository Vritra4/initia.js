import type { DescMessage } from '@bufbuild/protobuf'
import {
  MsgRegisterAccountSchema,
  MsgSubmitTxSchema,
} from '@initia/initia-proto/initia/intertx/v1/tx_pb'
import { msg, type FriendlyInit, type Message } from '../types'

export interface InterTxModule {
  registerAccount(
    init: FriendlyInit<typeof MsgRegisterAccountSchema>
  ): Message<typeof MsgRegisterAccountSchema>
  submitTx(init: FriendlyInit<typeof MsgSubmitTxSchema>): Message<typeof MsgSubmitTxSchema>
}

export const interTxSchemas: DescMessage[] = [MsgRegisterAccountSchema, MsgSubmitTxSchema]

export const interTxModule: InterTxModule = {
  registerAccount: init => msg(MsgRegisterAccountSchema, init),
  submitTx: init => msg(MsgSubmitTxSchema, init),
}
