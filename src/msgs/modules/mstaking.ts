import type { DescMessage } from '@bufbuild/protobuf'
import {
  MsgCreateValidatorSchema,
  MsgEditValidatorSchema,
  MsgDelegateSchema,
  MsgBeginRedelegateSchema,
  MsgUndelegateSchema,
  MsgCancelUnbondingDelegationSchema,
  MsgUpdateParamsSchema,
} from '@initia/initia-proto/initia/mstaking/v1/tx_pb'
import { msg, type FriendlyInit, type Message } from '../types'

export interface MstakingModule {
  createValidator(
    init: FriendlyInit<typeof MsgCreateValidatorSchema>
  ): Message<typeof MsgCreateValidatorSchema>
  editValidator(
    init: FriendlyInit<typeof MsgEditValidatorSchema>
  ): Message<typeof MsgEditValidatorSchema>
  delegate(init: FriendlyInit<typeof MsgDelegateSchema>): Message<typeof MsgDelegateSchema>
  beginRedelegate(
    init: FriendlyInit<typeof MsgBeginRedelegateSchema>
  ): Message<typeof MsgBeginRedelegateSchema>
  undelegate(init: FriendlyInit<typeof MsgUndelegateSchema>): Message<typeof MsgUndelegateSchema>
  cancelUnbondingDelegation(
    init: FriendlyInit<typeof MsgCancelUnbondingDelegationSchema>
  ): Message<typeof MsgCancelUnbondingDelegationSchema>
  updateParams(
    init: FriendlyInit<typeof MsgUpdateParamsSchema>
  ): Message<typeof MsgUpdateParamsSchema>
}

export const mstakingSchemas: DescMessage[] = [
  MsgCreateValidatorSchema,
  MsgEditValidatorSchema,
  MsgDelegateSchema,
  MsgBeginRedelegateSchema,
  MsgUndelegateSchema,
  MsgCancelUnbondingDelegationSchema,
  MsgUpdateParamsSchema,
]

export const mstakingModule: MstakingModule = {
  createValidator: init => msg(MsgCreateValidatorSchema, init),
  editValidator: init => msg(MsgEditValidatorSchema, init),
  delegate: init => msg(MsgDelegateSchema, init),
  beginRedelegate: init => msg(MsgBeginRedelegateSchema, init),
  undelegate: init => msg(MsgUndelegateSchema, init),
  cancelUnbondingDelegation: init => msg(MsgCancelUnbondingDelegationSchema, init),
  updateParams: init => msg(MsgUpdateParamsSchema, init),
}
