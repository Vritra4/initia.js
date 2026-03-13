import type { DescMessage } from '@bufbuild/protobuf'
import {
  MsgChannelOpenInitSchema,
  MsgChannelOpenTrySchema,
  MsgChannelOpenAckSchema,
  MsgChannelOpenConfirmSchema,
  MsgChannelCloseInitSchema,
  MsgChannelCloseConfirmSchema,
  MsgRecvPacketSchema,
  MsgTimeoutSchema,
  MsgTimeoutOnCloseSchema,
  MsgAcknowledgementSchema,
} from '@initia/initia-proto/ibc/core/channel/v1/tx_pb'
import {
  MsgCreateClientSchema,
  MsgUpdateClientSchema,
  MsgUpgradeClientSchema,
  MsgSubmitMisbehaviourSchema,
  MsgRecoverClientSchema,
  MsgIBCSoftwareUpgradeSchema,
  MsgUpdateParamsSchema as MsgClientUpdateParamsSchema,
} from '@initia/initia-proto/ibc/core/client/v1/tx_pb'
import {
  MsgConnectionOpenInitSchema,
  MsgConnectionOpenTrySchema,
  MsgConnectionOpenAckSchema,
  MsgConnectionOpenConfirmSchema,
  MsgUpdateParamsSchema as MsgConnectionUpdateParamsSchema,
} from '@initia/initia-proto/ibc/core/connection/v1/tx_pb'
import { msg, type FriendlyInit, type Message } from '../types'

export interface IbcCoreModule {
  // Channel
  channelOpenInit(
    init: FriendlyInit<typeof MsgChannelOpenInitSchema>
  ): Message<typeof MsgChannelOpenInitSchema>
  channelOpenTry(
    init: FriendlyInit<typeof MsgChannelOpenTrySchema>
  ): Message<typeof MsgChannelOpenTrySchema>
  channelOpenAck(
    init: FriendlyInit<typeof MsgChannelOpenAckSchema>
  ): Message<typeof MsgChannelOpenAckSchema>
  channelOpenConfirm(
    init: FriendlyInit<typeof MsgChannelOpenConfirmSchema>
  ): Message<typeof MsgChannelOpenConfirmSchema>
  channelCloseInit(
    init: FriendlyInit<typeof MsgChannelCloseInitSchema>
  ): Message<typeof MsgChannelCloseInitSchema>
  channelCloseConfirm(
    init: FriendlyInit<typeof MsgChannelCloseConfirmSchema>
  ): Message<typeof MsgChannelCloseConfirmSchema>
  recvPacket(init: FriendlyInit<typeof MsgRecvPacketSchema>): Message<typeof MsgRecvPacketSchema>
  timeout(init: FriendlyInit<typeof MsgTimeoutSchema>): Message<typeof MsgTimeoutSchema>
  timeoutOnClose(
    init: FriendlyInit<typeof MsgTimeoutOnCloseSchema>
  ): Message<typeof MsgTimeoutOnCloseSchema>
  acknowledgement(
    init: FriendlyInit<typeof MsgAcknowledgementSchema>
  ): Message<typeof MsgAcknowledgementSchema>

  // Client
  createClient(
    init: FriendlyInit<typeof MsgCreateClientSchema>
  ): Message<typeof MsgCreateClientSchema>
  updateClient(
    init: FriendlyInit<typeof MsgUpdateClientSchema>
  ): Message<typeof MsgUpdateClientSchema>
  upgradeClient(
    init: FriendlyInit<typeof MsgUpgradeClientSchema>
  ): Message<typeof MsgUpgradeClientSchema>
  submitMisbehaviour(
    init: FriendlyInit<typeof MsgSubmitMisbehaviourSchema>
  ): Message<typeof MsgSubmitMisbehaviourSchema>
  recoverClient(
    init: FriendlyInit<typeof MsgRecoverClientSchema>
  ): Message<typeof MsgRecoverClientSchema>
  ibcSoftwareUpgrade(
    init: FriendlyInit<typeof MsgIBCSoftwareUpgradeSchema>
  ): Message<typeof MsgIBCSoftwareUpgradeSchema>
  clientUpdateParams(
    init: FriendlyInit<typeof MsgClientUpdateParamsSchema>
  ): Message<typeof MsgClientUpdateParamsSchema>

  // Connection
  connectionOpenInit(
    init: FriendlyInit<typeof MsgConnectionOpenInitSchema>
  ): Message<typeof MsgConnectionOpenInitSchema>
  connectionOpenTry(
    init: FriendlyInit<typeof MsgConnectionOpenTrySchema>
  ): Message<typeof MsgConnectionOpenTrySchema>
  connectionOpenAck(
    init: FriendlyInit<typeof MsgConnectionOpenAckSchema>
  ): Message<typeof MsgConnectionOpenAckSchema>
  connectionOpenConfirm(
    init: FriendlyInit<typeof MsgConnectionOpenConfirmSchema>
  ): Message<typeof MsgConnectionOpenConfirmSchema>
  connectionUpdateParams(
    init: FriendlyInit<typeof MsgConnectionUpdateParamsSchema>
  ): Message<typeof MsgConnectionUpdateParamsSchema>
}

export const ibcCoreSchemas: DescMessage[] = [
  // Channel
  MsgChannelOpenInitSchema,
  MsgChannelOpenTrySchema,
  MsgChannelOpenAckSchema,
  MsgChannelOpenConfirmSchema,
  MsgChannelCloseInitSchema,
  MsgChannelCloseConfirmSchema,
  MsgRecvPacketSchema,
  MsgTimeoutSchema,
  MsgTimeoutOnCloseSchema,
  MsgAcknowledgementSchema,
  // Client
  MsgCreateClientSchema,
  MsgUpdateClientSchema,
  MsgUpgradeClientSchema,
  MsgSubmitMisbehaviourSchema,
  MsgRecoverClientSchema,
  MsgIBCSoftwareUpgradeSchema,
  MsgClientUpdateParamsSchema,
  // Connection
  MsgConnectionOpenInitSchema,
  MsgConnectionOpenTrySchema,
  MsgConnectionOpenAckSchema,
  MsgConnectionOpenConfirmSchema,
  MsgConnectionUpdateParamsSchema,
]

export const ibcCoreModule: IbcCoreModule = {
  // Channel
  channelOpenInit: init => msg(MsgChannelOpenInitSchema, init),
  channelOpenTry: init => msg(MsgChannelOpenTrySchema, init),
  channelOpenAck: init => msg(MsgChannelOpenAckSchema, init),
  channelOpenConfirm: init => msg(MsgChannelOpenConfirmSchema, init),
  channelCloseInit: init => msg(MsgChannelCloseInitSchema, init),
  channelCloseConfirm: init => msg(MsgChannelCloseConfirmSchema, init),
  recvPacket: init => msg(MsgRecvPacketSchema, init),
  timeout: init => msg(MsgTimeoutSchema, init),
  timeoutOnClose: init => msg(MsgTimeoutOnCloseSchema, init),
  acknowledgement: init => msg(MsgAcknowledgementSchema, init),
  // Client
  createClient: init => msg(MsgCreateClientSchema, init),
  updateClient: init => msg(MsgUpdateClientSchema, init),
  upgradeClient: init => msg(MsgUpgradeClientSchema, init),
  submitMisbehaviour: init => msg(MsgSubmitMisbehaviourSchema, init),
  recoverClient: init => msg(MsgRecoverClientSchema, init),
  ibcSoftwareUpgrade: init => msg(MsgIBCSoftwareUpgradeSchema, init),
  clientUpdateParams: init => msg(MsgClientUpdateParamsSchema, init),
  // Connection
  connectionOpenInit: init => msg(MsgConnectionOpenInitSchema, init),
  connectionOpenTry: init => msg(MsgConnectionOpenTrySchema, init),
  connectionOpenAck: init => msg(MsgConnectionOpenAckSchema, init),
  connectionOpenConfirm: init => msg(MsgConnectionOpenConfirmSchema, init),
  connectionUpdateParams: init => msg(MsgConnectionUpdateParamsSchema, init),
}
