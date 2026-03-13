import type { DescMessage } from '@bufbuild/protobuf'
import {
  MsgUpdateParamsSchema,
  MsgAddEmergencySubmittersSchema,
  MsgRemoveEmergencySubmittersSchema,
} from '@initia/initia-proto/initia/gov/v1/tx_pb'
import { msg, type FriendlyInit, type Message } from '../types'

export interface InitiaGovModule {
  updateParams(
    init: FriendlyInit<typeof MsgUpdateParamsSchema>
  ): Message<typeof MsgUpdateParamsSchema>
  addEmergencySubmitters(
    init: FriendlyInit<typeof MsgAddEmergencySubmittersSchema>
  ): Message<typeof MsgAddEmergencySubmittersSchema>
  removeEmergencySubmitters(
    init: FriendlyInit<typeof MsgRemoveEmergencySubmittersSchema>
  ): Message<typeof MsgRemoveEmergencySubmittersSchema>
}

export const initiaGovSchemas: DescMessage[] = [
  MsgUpdateParamsSchema,
  MsgAddEmergencySubmittersSchema,
  MsgRemoveEmergencySubmittersSchema,
]

export const initiaGovModule: InitiaGovModule = {
  updateParams: init => msg(MsgUpdateParamsSchema, init),
  addEmergencySubmitters: init => msg(MsgAddEmergencySubmittersSchema, init),
  removeEmergencySubmitters: init => msg(MsgRemoveEmergencySubmittersSchema, init),
}
