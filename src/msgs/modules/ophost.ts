import type { DescMessage } from '@bufbuild/protobuf'
import {
  MsgRecordBatchSchema,
  MsgCreateBridgeSchema,
  MsgProposeOutputSchema,
  MsgDeleteOutputSchema,
  MsgInitiateTokenDepositSchema,
  MsgFinalizeTokenWithdrawalSchema,
  MsgUpdateProposerSchema,
  MsgUpdateChallengerSchema,
  MsgUpdateBatchInfoSchema,
  MsgUpdateOracleConfigSchema,
  MsgUpdateMetadataSchema,
  MsgUpdateParamsSchema,
  MsgUpdateFinalizationPeriodSchema,
  MsgRegisterMigrationInfoSchema,
} from '@initia/opinit-proto/opinit/ophost/v1/tx_pb'
import { msg, type FriendlyInit, type Message } from '../types'

export interface OphostModule {
  recordBatch(init: FriendlyInit<typeof MsgRecordBatchSchema>): Message<typeof MsgRecordBatchSchema>
  createBridge(
    init: FriendlyInit<typeof MsgCreateBridgeSchema>
  ): Message<typeof MsgCreateBridgeSchema>
  proposeOutput(
    init: FriendlyInit<typeof MsgProposeOutputSchema>
  ): Message<typeof MsgProposeOutputSchema>
  deleteOutput(
    init: FriendlyInit<typeof MsgDeleteOutputSchema>
  ): Message<typeof MsgDeleteOutputSchema>
  initiateTokenDeposit(
    init: FriendlyInit<typeof MsgInitiateTokenDepositSchema>
  ): Message<typeof MsgInitiateTokenDepositSchema>
  finalizeTokenWithdrawal(
    init: FriendlyInit<typeof MsgFinalizeTokenWithdrawalSchema>
  ): Message<typeof MsgFinalizeTokenWithdrawalSchema>
  updateProposer(
    init: FriendlyInit<typeof MsgUpdateProposerSchema>
  ): Message<typeof MsgUpdateProposerSchema>
  updateChallenger(
    init: FriendlyInit<typeof MsgUpdateChallengerSchema>
  ): Message<typeof MsgUpdateChallengerSchema>
  updateBatchInfo(
    init: FriendlyInit<typeof MsgUpdateBatchInfoSchema>
  ): Message<typeof MsgUpdateBatchInfoSchema>
  updateOracleConfig(
    init: FriendlyInit<typeof MsgUpdateOracleConfigSchema>
  ): Message<typeof MsgUpdateOracleConfigSchema>
  updateMetadata(
    init: FriendlyInit<typeof MsgUpdateMetadataSchema>
  ): Message<typeof MsgUpdateMetadataSchema>
  updateParams(
    init: FriendlyInit<typeof MsgUpdateParamsSchema>
  ): Message<typeof MsgUpdateParamsSchema>
  updateFinalizationPeriod(
    init: FriendlyInit<typeof MsgUpdateFinalizationPeriodSchema>
  ): Message<typeof MsgUpdateFinalizationPeriodSchema>
  registerMigrationInfo(
    init: FriendlyInit<typeof MsgRegisterMigrationInfoSchema>
  ): Message<typeof MsgRegisterMigrationInfoSchema>
}

export const ophostSchemas: DescMessage[] = [
  MsgRecordBatchSchema,
  MsgCreateBridgeSchema,
  MsgProposeOutputSchema,
  MsgDeleteOutputSchema,
  MsgInitiateTokenDepositSchema,
  MsgFinalizeTokenWithdrawalSchema,
  MsgUpdateProposerSchema,
  MsgUpdateChallengerSchema,
  MsgUpdateBatchInfoSchema,
  MsgUpdateOracleConfigSchema,
  MsgUpdateMetadataSchema,
  MsgUpdateParamsSchema,
  MsgUpdateFinalizationPeriodSchema,
  MsgRegisterMigrationInfoSchema,
]

export const ophostModule: OphostModule = {
  recordBatch: init => msg(MsgRecordBatchSchema, init),
  createBridge: init => msg(MsgCreateBridgeSchema, init),
  proposeOutput: init => msg(MsgProposeOutputSchema, init),
  deleteOutput: init => msg(MsgDeleteOutputSchema, init),
  initiateTokenDeposit: init => msg(MsgInitiateTokenDepositSchema, init),
  finalizeTokenWithdrawal: init => msg(MsgFinalizeTokenWithdrawalSchema, init),
  updateProposer: init => msg(MsgUpdateProposerSchema, init),
  updateChallenger: init => msg(MsgUpdateChallengerSchema, init),
  updateBatchInfo: init => msg(MsgUpdateBatchInfoSchema, init),
  updateOracleConfig: init => msg(MsgUpdateOracleConfigSchema, init),
  updateMetadata: init => msg(MsgUpdateMetadataSchema, init),
  updateParams: init => msg(MsgUpdateParamsSchema, init),
  updateFinalizationPeriod: init => msg(MsgUpdateFinalizationPeriodSchema, init),
  registerMigrationInfo: init => msg(MsgRegisterMigrationInfoSchema, init),
}
