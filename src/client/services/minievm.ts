/**
 * Minievm rollup services.
 *
 * Includes:
 * - Common: auth, bank, tx, tendermint
 * - Minievm-specific: evm, opchild
 *
 * Source imports: @initia/initia-proto, @initia/minievm-proto, @initia/opinit-proto (opchild)
 */

import { createCommonRegistry } from './common'

// Minievm services
import { Query as EvmQuery } from '@initia/minievm-proto/minievm/evm/v1/query_pb'

// OPinit child
import { Query as OpchildQuery } from '@initia/opinit-proto/opinit/opchild/v1/query_pb'

// Minievm-specific Any-wrapped types
import { file_minievm_evm_v1_auth } from '@initia/minievm-proto/minievm/evm/v1/auth_pb'

// Minievm Msg types
import { file_minievm_evm_v1_tx } from '@initia/minievm-proto/minievm/evm/v1/tx_pb'
import { file_opinit_opchild_v1_tx } from '@initia/opinit-proto/opinit/opchild/v1/tx_pb'

export const MinievmServices = createCommonRegistry()
  .addModule('evm', EvmQuery, file_minievm_evm_v1_tx)
  .addModule('opchild', OpchildQuery, file_opinit_opchild_v1_tx)
  .addTypes(file_minievm_evm_v1_auth)
