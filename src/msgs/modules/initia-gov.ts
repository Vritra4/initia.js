import type { DescMessage } from '@bufbuild/protobuf'
import {
  MsgUpdateParamsSchema,
  MsgAddEmergencyProposalSubmittersSchema,
  MsgRemoveEmergencyProposalSubmittersSchema,
} from '@buf/initia-labs_initia.bufbuild_es/initia/gov/v1/tx_pb'
import { msg, type FriendlyInit, type Message } from '../types'

export interface InitiaGovModule {
  updateParams(
    init: FriendlyInit<typeof MsgUpdateParamsSchema>
  ): Message<typeof MsgUpdateParamsSchema>
  addEmergencyProposalSubmitters(
    init: FriendlyInit<typeof MsgAddEmergencyProposalSubmittersSchema>
  ): Message<typeof MsgAddEmergencyProposalSubmittersSchema>
  removeEmergencyProposalSubmitters(
    init: FriendlyInit<typeof MsgRemoveEmergencyProposalSubmittersSchema>
  ): Message<typeof MsgRemoveEmergencyProposalSubmittersSchema>
}

export const initiaGovSchemas: DescMessage[] = [
  MsgUpdateParamsSchema,
  MsgAddEmergencyProposalSubmittersSchema,
  MsgRemoveEmergencyProposalSubmittersSchema,
]

export const initiaGovModule: InitiaGovModule = {
  updateParams: init => msg(MsgUpdateParamsSchema, init),
  addEmergencyProposalSubmitters: init => msg(MsgAddEmergencyProposalSubmittersSchema, init),
  removeEmergencyProposalSubmitters: init => msg(MsgRemoveEmergencyProposalSubmittersSchema, init),
}
