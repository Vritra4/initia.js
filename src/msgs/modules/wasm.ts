import type { DescMessage } from '@bufbuild/protobuf'
import {
  MsgStoreCodeSchema,
  MsgInstantiateContractSchema,
  MsgInstantiateContract2Schema,
  MsgExecuteContractSchema,
  MsgMigrateContractSchema,
  MsgUpdateAdminSchema,
  MsgClearAdminSchema,
  MsgUpdateInstantiateConfigSchema,
  MsgUpdateParamsSchema,
  MsgSudoContractSchema,
  MsgPinCodesSchema,
  MsgUnpinCodesSchema,
  MsgStoreAndInstantiateContractSchema,
  MsgRemoveCodeUploadParamsAddressesSchema,
  MsgAddCodeUploadParamsAddressesSchema,
  MsgStoreAndMigrateContractSchema,
  MsgUpdateContractLabelSchema,
} from '@initia/miniwasm-proto/cosmwasm/wasm/v1/tx_pb'
import { msg, msgWithDefaults, type FriendlyInit, type Message, type WithDefaults } from '../types'

export interface WasmModule {
  storeCode(
    init: WithDefaults<FriendlyInit<typeof MsgStoreCodeSchema>, 'instantiatePermission'>
  ): Message<typeof MsgStoreCodeSchema>
  instantiateContract(
    init: WithDefaults<FriendlyInit<typeof MsgInstantiateContractSchema>, 'admin' | 'funds'>
  ): Message<typeof MsgInstantiateContractSchema>
  instantiateContract2(
    init: WithDefaults<
      FriendlyInit<typeof MsgInstantiateContract2Schema>,
      'admin' | 'fixMsg' | 'funds'
    >
  ): Message<typeof MsgInstantiateContract2Schema>
  executeContract(
    init: WithDefaults<FriendlyInit<typeof MsgExecuteContractSchema>, 'funds'>
  ): Message<typeof MsgExecuteContractSchema>
  migrateContract(
    init: FriendlyInit<typeof MsgMigrateContractSchema>
  ): Message<typeof MsgMigrateContractSchema>
  updateAdmin(init: FriendlyInit<typeof MsgUpdateAdminSchema>): Message<typeof MsgUpdateAdminSchema>
  clearAdmin(init: FriendlyInit<typeof MsgClearAdminSchema>): Message<typeof MsgClearAdminSchema>
  updateInstantiateConfig(
    init: FriendlyInit<typeof MsgUpdateInstantiateConfigSchema>
  ): Message<typeof MsgUpdateInstantiateConfigSchema>
  updateParams(
    init: FriendlyInit<typeof MsgUpdateParamsSchema>
  ): Message<typeof MsgUpdateParamsSchema>
  sudoContract(
    init: FriendlyInit<typeof MsgSudoContractSchema>
  ): Message<typeof MsgSudoContractSchema>
  pinCodes(init: FriendlyInit<typeof MsgPinCodesSchema>): Message<typeof MsgPinCodesSchema>
  unpinCodes(init: FriendlyInit<typeof MsgUnpinCodesSchema>): Message<typeof MsgUnpinCodesSchema>
  storeAndInstantiateContract(
    init: WithDefaults<
      FriendlyInit<typeof MsgStoreAndInstantiateContractSchema>,
      'admin' | 'funds' | 'unpinCode' | 'source' | 'builder' | 'instantiatePermission' | 'codeHash'
    >
  ): Message<typeof MsgStoreAndInstantiateContractSchema>
  removeCodeUploadParamsAddresses(
    init: FriendlyInit<typeof MsgRemoveCodeUploadParamsAddressesSchema>
  ): Message<typeof MsgRemoveCodeUploadParamsAddressesSchema>
  addCodeUploadParamsAddresses(
    init: FriendlyInit<typeof MsgAddCodeUploadParamsAddressesSchema>
  ): Message<typeof MsgAddCodeUploadParamsAddressesSchema>
  storeAndMigrateContract(
    init: FriendlyInit<typeof MsgStoreAndMigrateContractSchema>
  ): Message<typeof MsgStoreAndMigrateContractSchema>
  updateContractLabel(
    init: FriendlyInit<typeof MsgUpdateContractLabelSchema>
  ): Message<typeof MsgUpdateContractLabelSchema>
}

export const wasmSchemas: DescMessage[] = [
  MsgStoreCodeSchema,
  MsgInstantiateContractSchema,
  MsgInstantiateContract2Schema,
  MsgExecuteContractSchema,
  MsgMigrateContractSchema,
  MsgUpdateAdminSchema,
  MsgClearAdminSchema,
  MsgUpdateInstantiateConfigSchema,
  MsgUpdateParamsSchema,
  MsgSudoContractSchema,
  MsgPinCodesSchema,
  MsgUnpinCodesSchema,
  MsgStoreAndInstantiateContractSchema,
  MsgRemoveCodeUploadParamsAddressesSchema,
  MsgAddCodeUploadParamsAddressesSchema,
  MsgStoreAndMigrateContractSchema,
  MsgUpdateContractLabelSchema,
]

export const wasmModule: WasmModule = {
  storeCode: init => msgWithDefaults(MsgStoreCodeSchema, {}, init),
  instantiateContract: init => msgWithDefaults(MsgInstantiateContractSchema, { admin: '' }, init),
  instantiateContract2: init =>
    msgWithDefaults(MsgInstantiateContract2Schema, { admin: '', fixMsg: false }, init),
  executeContract: init => msgWithDefaults(MsgExecuteContractSchema, {}, init),
  migrateContract: init => msg(MsgMigrateContractSchema, init),
  updateAdmin: init => msg(MsgUpdateAdminSchema, init),
  clearAdmin: init => msg(MsgClearAdminSchema, init),
  updateInstantiateConfig: init => msg(MsgUpdateInstantiateConfigSchema, init),
  updateParams: init => msg(MsgUpdateParamsSchema, init),
  sudoContract: init => msg(MsgSudoContractSchema, init),
  pinCodes: init => msg(MsgPinCodesSchema, init),
  unpinCodes: init => msg(MsgUnpinCodesSchema, init),
  storeAndInstantiateContract: init =>
    msgWithDefaults(
      MsgStoreAndInstantiateContractSchema,
      { admin: '', unpinCode: false, source: '', builder: '' },
      init
    ),
  removeCodeUploadParamsAddresses: init => msg(MsgRemoveCodeUploadParamsAddressesSchema, init),
  addCodeUploadParamsAddresses: init => msg(MsgAddCodeUploadParamsAddressesSchema, init),
  storeAndMigrateContract: init => msg(MsgStoreAndMigrateContractSchema, init),
  updateContractLabel: init => msg(MsgUpdateContractLabelSchema, init),
}
