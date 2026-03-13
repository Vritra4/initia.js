import type { DescMessage } from '@bufbuild/protobuf'
import {
  MsgSoftwareUpgradeSchema,
  MsgCancelUpgradeSchema,
} from '@initia/initia-proto/cosmos/upgrade/v1beta1/tx_pb'
import { msg, type FriendlyInit, type Message } from '../types'

export interface UpgradeModule {
  softwareUpgrade(
    init: FriendlyInit<typeof MsgSoftwareUpgradeSchema>
  ): Message<typeof MsgSoftwareUpgradeSchema>
  cancelUpgrade(
    init: FriendlyInit<typeof MsgCancelUpgradeSchema>
  ): Message<typeof MsgCancelUpgradeSchema>
}

export const upgradeSchemas: DescMessage[] = [MsgSoftwareUpgradeSchema, MsgCancelUpgradeSchema]

export const upgradeModule: UpgradeModule = {
  softwareUpgrade: init => msg(MsgSoftwareUpgradeSchema, init),
  cancelUpgrade: init => msg(MsgCancelUpgradeSchema, init),
}
