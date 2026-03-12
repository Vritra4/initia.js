/**
 * Initia L1 services.
 *
 * Includes:
 * - Common: auth, bank, tx, tendermint
 * - Initia-specific: mstaking, move, distribution, ophost
 * - Gov: v1 by default, v1beta1 for testnet
 *
 * Source imports: @buf/cosmos_cosmos-sdk, @buf/initia-labs_initia, @buf/initia-labs_opinit (ophost)
 */

import { createCommonRegistry } from './common'

// Cosmos SDK services (L1 only)
import { Query as GovV1Query } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/gov/v1/query_pb'
import { Query as GovV1Beta1Query } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/gov/v1beta1/query_pb'

// Cosmos SDK Msg types (L1 modules)
import { file_cosmos_auth_v1beta1_tx } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/auth/v1beta1/tx_pb'
import { file_cosmos_group_v1_tx } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/group/v1/tx_pb'
import { file_cosmos_slashing_v1beta1_tx } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/slashing/v1beta1/tx_pb'
import { file_cosmos_evidence_v1beta1_tx } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/evidence/v1beta1/tx_pb'
import { file_cosmos_upgrade_v1beta1_tx } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/upgrade/v1beta1/tx_pb'
import { file_cosmos_vesting_v1beta1_tx } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/vesting/v1beta1/tx_pb'
import { file_cosmos_consensus_v1_tx } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/consensus/v1/tx_pb'

// Initia services
import { Query as MstakingQuery } from '@buf/initia-labs_initia.bufbuild_es/initia/mstaking/v1/query_pb'
import { Query as MoveQuery } from '@buf/initia-labs_initia.bufbuild_es/initia/move/v1/query_pb'
import { Query as InitiaDistributionQuery } from '@buf/initia-labs_initia.bufbuild_es/initia/distribution/v1/query_pb'

// OPinit host
import { Query as OphostQuery } from '@buf/initia-labs_opinit.bufbuild_es/opinit/ophost/v1/query_pb'

// Initia-specific Any-wrapped types
import { file_initia_crypto_v1beta1_ethsecp256k1_keys } from '@buf/initia-labs_initia.bufbuild_es/initia/crypto/v1beta1/ethsecp256k1/keys_pb'
import { file_initia_move_v1_auth } from '@buf/initia-labs_initia.bufbuild_es/initia/move/v1/auth_pb'

// Initia Msg types
import { file_initia_move_v1_tx } from '@buf/initia-labs_initia.bufbuild_es/initia/move/v1/tx_pb'
import { file_initia_mstaking_v1_tx } from '@buf/initia-labs_initia.bufbuild_es/initia/mstaking/v1/tx_pb'
import { file_initia_distribution_v1_tx } from '@buf/initia-labs_initia.bufbuild_es/initia/distribution/v1/tx_pb'
import { file_initia_gov_v1_tx } from '@buf/initia-labs_initia.bufbuild_es/initia/gov/v1/tx_pb'
import { file_initia_reward_v1_tx } from '@buf/initia-labs_initia.bufbuild_es/initia/reward/v1/tx_pb'
import { file_initia_bank_v1_tx } from '@buf/initia-labs_initia.bufbuild_es/initia/bank/v1/tx_pb'
import { file_initia_dynamicfee_v1_tx } from '@buf/initia-labs_initia.bufbuild_es/initia/dynamicfee/v1/tx_pb'
import { file_initia_ibchooks_v1_tx } from '@buf/initia-labs_initia.bufbuild_es/initia/ibchooks/v1/tx_pb'
import { file_initia_intertx_v1_tx } from '@buf/initia-labs_initia.bufbuild_es/initia/intertx/v1/tx_pb'
import { file_opinit_ophost_v1_tx } from '@buf/initia-labs_opinit.bufbuild_es/opinit/ophost/v1/tx_pb'

// Initia custom IBC Msg types
import { file_ibc_applications_nft_transfer_v1_tx } from '@buf/initia-labs_initia.bufbuild_es/ibc/applications/nft_transfer/v1/tx_pb'
import { file_ibc_applications_perm_v1_tx } from '@buf/initia-labs_initia.bufbuild_es/ibc/applications/perm/v1/tx_pb'

export const InitiaServices = createCommonRegistry()
  .addModule('mstaking', MstakingQuery, file_initia_mstaking_v1_tx)
  .addModule('move', MoveQuery, file_initia_move_v1_tx)
  .addModule('distribution', InitiaDistributionQuery, file_initia_distribution_v1_tx)
  .addModule('ophost', OphostQuery, file_opinit_ophost_v1_tx)
  .addModule('gov', GovV1Query, file_initia_gov_v1_tx)
  .addTypes(
    file_initia_crypto_v1beta1_ethsecp256k1_keys,
    file_initia_move_v1_auth,
    file_initia_reward_v1_tx,
    file_initia_bank_v1_tx,
    file_initia_dynamicfee_v1_tx,
    file_initia_ibchooks_v1_tx,
    file_initia_intertx_v1_tx,
    file_ibc_applications_nft_transfer_v1_tx,
    file_ibc_applications_perm_v1_tx,
    file_cosmos_auth_v1beta1_tx,
    file_cosmos_group_v1_tx,
    file_cosmos_slashing_v1beta1_tx,
    file_cosmos_evidence_v1beta1_tx,
    file_cosmos_upgrade_v1beta1_tx,
    file_cosmos_vesting_v1beta1_tx,
    file_cosmos_consensus_v1_tx
  )
  .forNetwork('testnet')
  .addModule('gov', GovV1Beta1Query)
