import type { DescMessage } from '@bufbuild/protobuf'
import {
  MsgPublishSchema,
  MsgExecuteSchema,
  MsgExecuteJSONSchema,
  MsgScriptSchema,
  MsgScriptJSONSchema,
  MsgGovPublishSchema,
  MsgGovExecuteSchema,
  MsgGovExecuteJSONSchema,
  MsgGovScriptSchema,
  MsgGovScriptJSONSchema,
  MsgWhitelistStakingSchema,
  MsgWhitelistGasPriceSchema,
  MsgDelistStakingSchema,
  MsgDelistGasPriceSchema,
  MsgUpdateParamsSchema,
} from '@initia/initia-proto/initia/move/v1/tx_pb'
import { msg, type FriendlyInit, type Message } from '../types'

export interface MoveModule {
  publish(init: FriendlyInit<typeof MsgPublishSchema>): Message<typeof MsgPublishSchema>
  execute(init: FriendlyInit<typeof MsgExecuteSchema>): Message<typeof MsgExecuteSchema>
  executeJSON(init: FriendlyInit<typeof MsgExecuteJSONSchema>): Message<typeof MsgExecuteJSONSchema>
  script(init: FriendlyInit<typeof MsgScriptSchema>): Message<typeof MsgScriptSchema>
  scriptJSON(init: FriendlyInit<typeof MsgScriptJSONSchema>): Message<typeof MsgScriptJSONSchema>
  govPublish(init: FriendlyInit<typeof MsgGovPublishSchema>): Message<typeof MsgGovPublishSchema>
  govExecute(init: FriendlyInit<typeof MsgGovExecuteSchema>): Message<typeof MsgGovExecuteSchema>
  govExecuteJSON(
    init: FriendlyInit<typeof MsgGovExecuteJSONSchema>
  ): Message<typeof MsgGovExecuteJSONSchema>
  govScript(init: FriendlyInit<typeof MsgGovScriptSchema>): Message<typeof MsgGovScriptSchema>
  govScriptJSON(
    init: FriendlyInit<typeof MsgGovScriptJSONSchema>
  ): Message<typeof MsgGovScriptJSONSchema>
  whitelistStaking(
    init: FriendlyInit<typeof MsgWhitelistStakingSchema>
  ): Message<typeof MsgWhitelistStakingSchema>
  whitelistGasPrice(
    init: FriendlyInit<typeof MsgWhitelistGasPriceSchema>
  ): Message<typeof MsgWhitelistGasPriceSchema>
  delistStaking(
    init: FriendlyInit<typeof MsgDelistStakingSchema>
  ): Message<typeof MsgDelistStakingSchema>
  delistGasPrice(
    init: FriendlyInit<typeof MsgDelistGasPriceSchema>
  ): Message<typeof MsgDelistGasPriceSchema>
  updateParams(
    init: FriendlyInit<typeof MsgUpdateParamsSchema>
  ): Message<typeof MsgUpdateParamsSchema>
}

export const moveSchemas: DescMessage[] = [
  MsgPublishSchema,
  MsgExecuteSchema,
  MsgExecuteJSONSchema,
  MsgScriptSchema,
  MsgScriptJSONSchema,
  MsgGovPublishSchema,
  MsgGovExecuteSchema,
  MsgGovExecuteJSONSchema,
  MsgGovScriptSchema,
  MsgGovScriptJSONSchema,
  MsgWhitelistStakingSchema,
  MsgWhitelistGasPriceSchema,
  MsgDelistStakingSchema,
  MsgDelistGasPriceSchema,
  MsgUpdateParamsSchema,
]

export const moveModule: MoveModule = {
  publish: init => msg(MsgPublishSchema, init),
  execute: init => msg(MsgExecuteSchema, init),
  executeJSON: init => msg(MsgExecuteJSONSchema, init),
  script: init => msg(MsgScriptSchema, init),
  scriptJSON: init => msg(MsgScriptJSONSchema, init),
  govPublish: init => msg(MsgGovPublishSchema, init),
  govExecute: init => msg(MsgGovExecuteSchema, init),
  govExecuteJSON: init => msg(MsgGovExecuteJSONSchema, init),
  govScript: init => msg(MsgGovScriptSchema, init),
  govScriptJSON: init => msg(MsgGovScriptJSONSchema, init),
  whitelistStaking: init => msg(MsgWhitelistStakingSchema, init),
  whitelistGasPrice: init => msg(MsgWhitelistGasPriceSchema, init),
  delistStaking: init => msg(MsgDelistStakingSchema, init),
  delistGasPrice: init => msg(MsgDelistGasPriceSchema, init),
  updateParams: init => msg(MsgUpdateParamsSchema, init),
}
