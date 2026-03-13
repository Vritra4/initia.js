import type { DescMessage } from '@bufbuild/protobuf'
import { MsgSetDenomMetadataSchema } from '@initia/initia-proto/initia/bank/v1/tx_pb'
import { msg, type FriendlyInit, type Message } from '../types'

export interface InitiaBankModule {
  setDenomMetadata(
    init: FriendlyInit<typeof MsgSetDenomMetadataSchema>
  ): Message<typeof MsgSetDenomMetadataSchema>
}

export const initiaBankSchemas: DescMessage[] = [MsgSetDenomMetadataSchema]

export const initiaBankModule: InitiaBankModule = {
  setDenomMetadata: init => msg(MsgSetDenomMetadataSchema, init),
}
