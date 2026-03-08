/**
 * Individual module definitions for custom chain composition.
 *
 * Each module exports: interface, schemas array, and builder object.
 * Use with defineModule() and createMsgs() for custom chains.
 *
 * @example
 * ```typescript
 * import { defineModule, createMsgs } from 'initia.js/msgs'
 * import { govModule, govSchemas } from 'initia.js/modules'
 *
 * const myChain = createMsgs('other', {
 *   modules: {
 *     gov: defineModule({ schemas: govSchemas, builders: govModule }),
 *   }
 * })
 * ```
 */

// Cosmos SDK
export { authModule, authSchemas, type AuthModule } from './auth'
export { authzModule, authzSchemas, type AuthzModule } from './authz'
export { bankModule, bankSchemas, type BankModule } from './bank'
export { consensusModule, consensusSchemas, type ConsensusModule } from './consensus'
export { crisisModule, crisisSchemas, type CrisisModule } from './crisis'
export { distributionModule, distributionSchemas, type DistributionModule } from './distribution'
export { evidenceModule, evidenceSchemas, type EvidenceModule } from './evidence'
export { feegrantModule, feegrantSchemas, type FeegrantModule } from './feegrant'
export { govModule, govSchemas, type GovModule } from './gov'
export { govLegacyModule, govLegacySchemas, type GovLegacyModule } from './gov-legacy'
export { groupModule, groupSchemas, type GroupModule } from './group'
export { slashingModule, slashingSchemas, type SlashingModule } from './slashing'
export { upgradeModule, upgradeSchemas, type UpgradeModule } from './upgrade'

// IBC
export { ibcModule, ibcSchemas, type IbcModule } from './ibc'
export { ibcCoreModule, ibcCoreSchemas, type IbcCoreModule } from './ibc-core'
export { ibcFeeModule, ibcFeeSchemas, type IbcFeeModule } from './ibc-fee'
export { ibcIcaModule, ibcIcaSchemas, type IbcIcaModule } from './ibc-ica'

// Initia L1
export { mstakingModule, mstakingSchemas, type MstakingModule } from './mstaking'
export { moveModule, moveSchemas, type MoveModule } from './move'
export { ophostModule, ophostSchemas, type OphostModule } from './ophost'
export { initiaBankModule, initiaBankSchemas, type InitiaBankModule } from './initia-bank'
export {
  initiaDistributionModule,
  initiaDistributionSchemas,
  type InitiaDistributionModule,
} from './initia-distribution'
export { initiaGovModule, initiaGovSchemas, type InitiaGovModule } from './initia-gov'
export { ibcHooksModule, ibcHooksSchemas, type IbcHooksModule } from './ibchooks'
export { interTxModule, interTxSchemas, type InterTxModule } from './intertx'
export { dynamicFeeModule, dynamicFeeSchemas, type DynamicFeeModule } from './dynamicfee'
export { rewardModule, rewardSchemas, type RewardModule } from './reward'

// Rollup
export { opchildModule, opchildSchemas, type OpchildModule } from './opchild'

// VM-specific
export { evmModule, evmSchemas, type EvmModule } from './evm'
export { wasmModule, wasmSchemas, type WasmModule } from './wasm'
