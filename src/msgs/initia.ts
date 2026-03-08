/**
 * Initia L1 message composition.
 *
 * Includes all modules registered on Initia L1.
 * Gov is always v1; testnet users override via createMsgs('initia', { modules: testnetModules }).
 * Decode registry includes both gov v1 and v1beta1 schemas.
 */

import type { InitiaMsgs, WithSchemas } from './types'
import { msgCustom } from './types'
import { createDecode } from './decode'

import { bankModule, bankSchemas } from './modules/bank'
import { ibcModule, ibcSchemas } from './modules/ibc'
import { ibcCoreModule, ibcCoreSchemas } from './modules/ibc-core'
import { ibcFeeModule, ibcFeeSchemas } from './modules/ibc-fee'
import { ibcIcaModule, ibcIcaSchemas } from './modules/ibc-ica'
import { mstakingModule, mstakingSchemas } from './modules/mstaking'
import { distributionModule, distributionSchemas } from './modules/distribution'
import { moveModule, moveSchemas } from './modules/move'
import { govModule, govSchemas } from './modules/gov'
import { govLegacySchemas } from './modules/gov-legacy'
import { authzModule, authzSchemas } from './modules/authz'
import { feegrantModule, feegrantSchemas } from './modules/feegrant'
import { groupModule, groupSchemas } from './modules/group'
import { ophostModule, ophostSchemas } from './modules/ophost'
import { slashingModule, slashingSchemas } from './modules/slashing'
import { evidenceModule, evidenceSchemas } from './modules/evidence'
import { upgradeModule, upgradeSchemas } from './modules/upgrade'
import { crisisModule, crisisSchemas } from './modules/crisis'
import { authModule, authSchemas } from './modules/auth'
import { consensusModule, consensusSchemas } from './modules/consensus'
import { initiaBankModule, initiaBankSchemas } from './modules/initia-bank'
import { initiaDistributionModule, initiaDistributionSchemas } from './modules/initia-distribution'
import { initiaGovModule, initiaGovSchemas } from './modules/initia-gov'
import { ibcHooksModule, ibcHooksSchemas } from './modules/ibchooks'
import { interTxModule, interTxSchemas } from './modules/intertx'
import { dynamicFeeModule, dynamicFeeSchemas } from './modules/dynamicfee'
import { rewardModule, rewardSchemas } from './modules/reward'

const allSchemas = [
  ...bankSchemas,
  ...ibcSchemas,
  ...ibcCoreSchemas,
  ...ibcFeeSchemas,
  ...ibcIcaSchemas,
  ...mstakingSchemas,
  ...distributionSchemas,
  ...moveSchemas,
  ...govSchemas,
  ...govLegacySchemas, // both v1 and v1beta1 in decode registry
  ...authzSchemas,
  ...feegrantSchemas,
  ...groupSchemas,
  ...ophostSchemas,
  ...slashingSchemas,
  ...evidenceSchemas,
  ...upgradeSchemas,
  ...crisisSchemas,
  ...authSchemas,
  ...consensusSchemas,
  ...initiaBankSchemas,
  ...initiaDistributionSchemas,
  ...initiaGovSchemas,
  ...ibcHooksSchemas,
  ...interTxSchemas,
  ...dynamicFeeSchemas,
  ...rewardSchemas,
]

export const initiaMsgs: WithSchemas<InitiaMsgs> = {
  bank: bankModule,
  ibc: ibcModule,
  ibcCore: ibcCoreModule,
  ibcFee: ibcFeeModule,
  ibcIca: ibcIcaModule,
  mstaking: mstakingModule,
  distribution: distributionModule,
  move: moveModule,
  gov: govModule,
  authz: authzModule,
  feegrant: feegrantModule,
  group: groupModule,
  ophost: ophostModule,
  slashing: slashingModule,
  evidence: evidenceModule,
  upgrade: upgradeModule,
  crisis: crisisModule,
  auth: authModule,
  consensus: consensusModule,
  initiaBank: initiaBankModule,
  initiaDistribution: initiaDistributionModule,
  initiaGov: initiaGovModule,
  ibcHooks: ibcHooksModule,
  interTx: interTxModule,
  dynamicFee: dynamicFeeModule,
  reward: rewardModule,
  custom: msgCustom,
  decode: createDecode(allSchemas),
  _schemas: allSchemas,
}
