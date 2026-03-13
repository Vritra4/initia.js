/**
 * Initia L1 services.
 *
 * Includes:
 * - Common: auth, bank, tx, tendermint
 * - Initia-specific: mstaking, move, distribution, ophost
 * - Gov: v1 by default, v1beta1 for testnet
 *
 * Source imports: @initia/initia-proto, @initia/opinit-proto (ophost)
 */

import { createCommonRegistry } from './common'

// Cosmos SDK services (L1 only)
import { Query as GovV1Query } from '@initia/initia-proto/cosmos/gov/v1/query_pb'
import { Query as GovV1Beta1Query } from '@initia/initia-proto/cosmos/gov/v1beta1/query_pb'

// Cosmos SDK Msg types (L1 modules)
import { file_cosmos_auth_v1beta1_tx } from '@initia/initia-proto/cosmos/auth/v1beta1/tx_pb'
import { file_cosmos_group_v1_tx } from '@initia/initia-proto/cosmos/group/v1/tx_pb'
import { file_cosmos_slashing_v1beta1_tx } from '@initia/initia-proto/cosmos/slashing/v1beta1/tx_pb'
import { file_cosmos_evidence_v1beta1_tx } from '@initia/initia-proto/cosmos/evidence/v1beta1/tx_pb'
import { file_cosmos_upgrade_v1beta1_tx } from '@initia/initia-proto/cosmos/upgrade/v1beta1/tx_pb'
import { file_cosmos_vesting_v1beta1_tx } from '@initia/initia-proto/cosmos/vesting/v1beta1/tx_pb'
import { file_cosmos_consensus_v1_tx } from '@initia/initia-proto/cosmos/consensus/v1/tx_pb'

// Initia services
import { Query as MstakingQuery } from '@initia/initia-proto/initia/mstaking/v1/query_pb'
import { Query as MoveQuery } from '@initia/initia-proto/initia/move/v1/query_pb'
import { Query as InitiaDistributionQuery } from '@initia/initia-proto/initia/distribution/v1/query_pb'

// OPinit host
import { Query as OphostQuery } from '@initia/opinit-proto/opinit/ophost/v1/query_pb'

// Initia-specific Any-wrapped types
import { file_initia_crypto_v1beta1_ethsecp256k1_keys } from '@initia/initia-proto/initia/crypto/v1beta1/ethsecp256k1/keys_pb'
import { file_initia_move_v1_auth } from '@initia/initia-proto/initia/move/v1/auth_pb'

// Initia Msg types
import { file_initia_move_v1_tx } from '@initia/initia-proto/initia/move/v1/tx_pb'
import { file_initia_mstaking_v1_tx } from '@initia/initia-proto/initia/mstaking/v1/tx_pb'
import { file_initia_distribution_v1_tx } from '@initia/initia-proto/initia/distribution/v1/tx_pb'
import { file_initia_gov_v1_tx } from '@initia/initia-proto/initia/gov/v1/tx_pb'
import { file_initia_reward_v1_tx } from '@initia/initia-proto/initia/reward/v1/tx_pb'
import { file_initia_bank_v1_tx } from '@initia/initia-proto/initia/bank/v1/tx_pb'
import { file_initia_dynamicfee_v1_tx } from '@initia/initia-proto/initia/dynamicfee/v1/tx_pb'
import { file_initia_ibchooks_v1_tx } from '@initia/initia-proto/initia/ibchooks/v1/tx_pb'
import { file_initia_intertx_v1_tx } from '@initia/initia-proto/initia/intertx/v1/tx_pb'
import { file_opinit_ophost_v1_tx } from '@initia/opinit-proto/opinit/ophost/v1/tx_pb'

// Initia custom IBC Msg types
import { file_ibc_applications_nft_transfer_v1_tx } from '@initia/initia-proto/ibc/applications/nft_transfer/v1/tx_pb'
import { file_ibc_applications_perm_v1_tx } from '@initia/initia-proto/ibc/applications/perm/v1/tx_pb'

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
