import type { DescMessage } from '@bufbuild/protobuf'
import {
  MsgCreateSchema,
  MsgCreate2Schema,
  MsgCallSchema,
  MsgUpdateParamsSchema,
} from '@buf/initia-labs_minievm.bufbuild_es/minievm/evm/v1/tx_pb'
import { msg, msgWithDefaults, type FriendlyInit, type Message, type WithDefaults } from '../types'

export interface EvmModule {
  create(
    init: WithDefaults<FriendlyInit<typeof MsgCreateSchema>, 'value' | 'accessList'>
  ): Message<typeof MsgCreateSchema>
  create2(
    init: WithDefaults<FriendlyInit<typeof MsgCreate2Schema>, 'value' | 'accessList'>
  ): Message<typeof MsgCreate2Schema>
  call(
    init: WithDefaults<FriendlyInit<typeof MsgCallSchema>, 'value' | 'accessList'>
  ): Message<typeof MsgCallSchema>
  updateParams(
    init: FriendlyInit<typeof MsgUpdateParamsSchema>
  ): Message<typeof MsgUpdateParamsSchema>
}

export const evmSchemas: DescMessage[] = [
  MsgCreateSchema,
  MsgCreate2Schema,
  MsgCallSchema,
  MsgUpdateParamsSchema,
]

export const evmModule: EvmModule = {
  create: init => msgWithDefaults(MsgCreateSchema, { value: '0' }, init),
  create2: init => msgWithDefaults(MsgCreate2Schema, { value: '0' }, init),
  call: init => msgWithDefaults(MsgCallSchema, { value: '0' }, init),
  updateParams: init => msg(MsgUpdateParamsSchema, init),
}
