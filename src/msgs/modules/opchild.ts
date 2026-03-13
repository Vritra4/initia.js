import type { DescMessage } from '@bufbuild/protobuf'
import {
  MsgExecuteMessagesSchema,
  MsgSetBridgeInfoSchema,
  MsgFinalizeTokenDepositSchema,
  MsgInitiateTokenWithdrawalSchema,
  MsgAddValidatorSchema,
  MsgRemoveValidatorSchema,
  MsgAddFeeWhitelistAddressesSchema,
  MsgRemoveFeeWhitelistAddressesSchema,
  MsgAddBridgeExecutorSchema,
  MsgRemoveBridgeExecutorSchema,
  MsgUpdateMinGasPricesSchema,
  MsgUpdateAdminSchema,
  MsgUpdateParamsSchema,
  MsgSpendFeePoolSchema,
  MsgUpdateOracleSchema,
  MsgRegisterMigrationInfoSchema,
  MsgMigrateTokenSchema,
} from '@initia/opinit-proto/opinit/opchild/v1/tx_pb'
import { msg, type FriendlyInit, type Message } from '../types'

export interface OpchildModule {
  executeMessages(
    init: FriendlyInit<typeof MsgExecuteMessagesSchema>
  ): Message<typeof MsgExecuteMessagesSchema>
  setBridgeInfo(
    init: FriendlyInit<typeof MsgSetBridgeInfoSchema>
  ): Message<typeof MsgSetBridgeInfoSchema>
  finalizeTokenDeposit(
    init: FriendlyInit<typeof MsgFinalizeTokenDepositSchema>
  ): Message<typeof MsgFinalizeTokenDepositSchema>
  initiateTokenWithdrawal(
    init: FriendlyInit<typeof MsgInitiateTokenWithdrawalSchema>
  ): Message<typeof MsgInitiateTokenWithdrawalSchema>
  addValidator(
    init: FriendlyInit<typeof MsgAddValidatorSchema>
  ): Message<typeof MsgAddValidatorSchema>
  removeValidator(
    init: FriendlyInit<typeof MsgRemoveValidatorSchema>
  ): Message<typeof MsgRemoveValidatorSchema>
  addFeeWhitelistAddresses(
    init: FriendlyInit<typeof MsgAddFeeWhitelistAddressesSchema>
  ): Message<typeof MsgAddFeeWhitelistAddressesSchema>
  removeFeeWhitelistAddresses(
    init: FriendlyInit<typeof MsgRemoveFeeWhitelistAddressesSchema>
  ): Message<typeof MsgRemoveFeeWhitelistAddressesSchema>
  addBridgeExecutor(
    init: FriendlyInit<typeof MsgAddBridgeExecutorSchema>
  ): Message<typeof MsgAddBridgeExecutorSchema>
  removeBridgeExecutor(
    init: FriendlyInit<typeof MsgRemoveBridgeExecutorSchema>
  ): Message<typeof MsgRemoveBridgeExecutorSchema>
  updateMinGasPrices(
    init: FriendlyInit<typeof MsgUpdateMinGasPricesSchema>
  ): Message<typeof MsgUpdateMinGasPricesSchema>
  updateAdmin(init: FriendlyInit<typeof MsgUpdateAdminSchema>): Message<typeof MsgUpdateAdminSchema>
  updateParams(
    init: FriendlyInit<typeof MsgUpdateParamsSchema>
  ): Message<typeof MsgUpdateParamsSchema>
  spendFeePool(
    init: FriendlyInit<typeof MsgSpendFeePoolSchema>
  ): Message<typeof MsgSpendFeePoolSchema>
  updateOracle(
    init: FriendlyInit<typeof MsgUpdateOracleSchema>
  ): Message<typeof MsgUpdateOracleSchema>
  registerMigrationInfo(
    init: FriendlyInit<typeof MsgRegisterMigrationInfoSchema>
  ): Message<typeof MsgRegisterMigrationInfoSchema>
  migrateToken(
    init: FriendlyInit<typeof MsgMigrateTokenSchema>
  ): Message<typeof MsgMigrateTokenSchema>
}

export const opchildSchemas: DescMessage[] = [
  MsgExecuteMessagesSchema,
  MsgSetBridgeInfoSchema,
  MsgFinalizeTokenDepositSchema,
  MsgInitiateTokenWithdrawalSchema,
  MsgAddValidatorSchema,
  MsgRemoveValidatorSchema,
  MsgAddFeeWhitelistAddressesSchema,
  MsgRemoveFeeWhitelistAddressesSchema,
  MsgAddBridgeExecutorSchema,
  MsgRemoveBridgeExecutorSchema,
  MsgUpdateMinGasPricesSchema,
  MsgUpdateAdminSchema,
  MsgUpdateParamsSchema,
  MsgSpendFeePoolSchema,
  MsgUpdateOracleSchema,
  MsgRegisterMigrationInfoSchema,
  MsgMigrateTokenSchema,
]

export const opchildModule: OpchildModule = {
  executeMessages: init => msg(MsgExecuteMessagesSchema, init),
  setBridgeInfo: init => msg(MsgSetBridgeInfoSchema, init),
  finalizeTokenDeposit: init => msg(MsgFinalizeTokenDepositSchema, init),
  initiateTokenWithdrawal: init => msg(MsgInitiateTokenWithdrawalSchema, init),
  addValidator: init => msg(MsgAddValidatorSchema, init),
  removeValidator: init => msg(MsgRemoveValidatorSchema, init),
  addFeeWhitelistAddresses: init => msg(MsgAddFeeWhitelistAddressesSchema, init),
  removeFeeWhitelistAddresses: init => msg(MsgRemoveFeeWhitelistAddressesSchema, init),
  addBridgeExecutor: init => msg(MsgAddBridgeExecutorSchema, init),
  removeBridgeExecutor: init => msg(MsgRemoveBridgeExecutorSchema, init),
  updateMinGasPrices: init => msg(MsgUpdateMinGasPricesSchema, init),
  updateAdmin: init => msg(MsgUpdateAdminSchema, init),
  updateParams: init => msg(MsgUpdateParamsSchema, init),
  spendFeePool: init => msg(MsgSpendFeePoolSchema, init),
  updateOracle: init => msg(MsgUpdateOracleSchema, init),
  registerMigrationInfo: init => msg(MsgRegisterMigrationInfoSchema, init),
  migrateToken: init => msg(MsgMigrateTokenSchema, init),
}
