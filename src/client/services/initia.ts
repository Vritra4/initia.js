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

// Cosmos SDK gov
import { Query as GovV1Query } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/gov/v1/query_pb'
import { Query as GovV1Beta1Query } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/gov/v1beta1/query_pb'

// Initia services
import { Query as MstakingQuery } from '@buf/initia-labs_initia.bufbuild_es/initia/mstaking/v1/query_pb'
import { Query as MoveQuery } from '@buf/initia-labs_initia.bufbuild_es/initia/move/v1/query_pb'
import { Query as InitiaDistributionQuery } from '@buf/initia-labs_initia.bufbuild_es/initia/distribution/v1/query_pb'

// OPinit host
import { Query as OphostQuery } from '@buf/initia-labs_opinit.bufbuild_es/opinit/ophost/v1/query_pb'

// Initia-specific Any-wrapped types
import { file_initia_crypto_v1beta1_ethsecp256k1_keys } from '@buf/initia-labs_initia.bufbuild_es/initia/crypto/v1beta1/ethsecp256k1/keys_pb'
import { file_initia_move_v1_auth } from '@buf/initia-labs_initia.bufbuild_es/initia/move/v1/auth_pb'

export const InitiaServices = createCommonRegistry()
  .add('mstaking', MstakingQuery)
  .add('move', MoveQuery)
  .add('distribution', InitiaDistributionQuery)
  .add('ophost', OphostQuery)
  .add('gov', GovV1Query)
  .addTypes(file_initia_crypto_v1beta1_ethsecp256k1_keys, file_initia_move_v1_auth)
  .forNetwork('testnet')
  .add('gov', GovV1Beta1Query)
