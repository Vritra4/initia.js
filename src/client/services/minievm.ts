/**
 * Minievm rollup services.
 *
 * Includes:
 * - Common: auth, bank, tx, tendermint
 * - Minievm-specific: evm, opchild
 *
 * Source imports: @buf/cosmos_cosmos-sdk, @buf/initia-labs_minievm, @buf/initia-labs_opinit (opchild)
 */

import { createCommonRegistry } from './common'

// Minievm services
import { Query as EvmQuery } from '@buf/initia-labs_minievm.bufbuild_es/minievm/evm/v1/query_pb'

// OPinit child
import { Query as OpchildQuery } from '@buf/initia-labs_opinit.bufbuild_es/opinit/opchild/v1/query_pb'

// Minievm-specific Any-wrapped types
import { file_minievm_evm_v1_auth } from '@buf/initia-labs_minievm.bufbuild_es/minievm/evm/v1/auth_pb'

// Minievm Msg types
import { file_minievm_evm_v1_tx } from '@buf/initia-labs_minievm.bufbuild_es/minievm/evm/v1/tx_pb'
import { file_opinit_opchild_v1_tx } from '@buf/initia-labs_opinit.bufbuild_es/opinit/opchild/v1/tx_pb'

export const MinievmServices = createCommonRegistry()
  .addModule('evm', EvmQuery, file_minievm_evm_v1_tx)
  .addModule('opchild', OpchildQuery, file_opinit_opchild_v1_tx)
  .addTypes(file_minievm_evm_v1_auth)
