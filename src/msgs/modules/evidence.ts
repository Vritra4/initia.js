import type { DescMessage } from '@bufbuild/protobuf'
import { MsgSubmitEvidenceSchema } from '@initia/initia-proto/cosmos/evidence/v1beta1/tx_pb'
import { msg, type FriendlyInit, type Message } from '../types'

export interface EvidenceModule {
  submitEvidence(
    init: FriendlyInit<typeof MsgSubmitEvidenceSchema>
  ): Message<typeof MsgSubmitEvidenceSchema>
}

export const evidenceSchemas: DescMessage[] = [MsgSubmitEvidenceSchema]

export const evidenceModule: EvidenceModule = {
  submitEvidence: init => msg(MsgSubmitEvidenceSchema, init),
}
