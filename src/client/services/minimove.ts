/**
 * Minimove rollup services.
 *
 * Includes:
 * - Common: auth, bank, tx, tendermint
 * - Minimove-specific: move, opchild
 *
 * Source imports: @initia/initia-proto, @initia/opinit-proto (opchild)
 */

import { createCommonRegistry } from './common'

// Initia move service
import { Query as MoveQuery } from '@initia/initia-proto/initia/move/v1/query_pb'

// OPinit child
import { Query as OpchildQuery } from '@initia/opinit-proto/opinit/opchild/v1/query_pb'

// Move VM Any-wrapped types (shared with Initia L1)
import { file_initia_move_v1_auth } from '@initia/initia-proto/initia/move/v1/auth_pb'

// Minimove Msg types
import { file_initia_move_v1_tx } from '@initia/initia-proto/initia/move/v1/tx_pb'
import { file_opinit_opchild_v1_tx } from '@initia/opinit-proto/opinit/opchild/v1/tx_pb'

export const MinimoveServices = createCommonRegistry()
  .addModule('move', MoveQuery, file_initia_move_v1_tx)
  .addModule('opchild', OpchildQuery, file_opinit_opchild_v1_tx)
  .addTypes(file_initia_move_v1_auth)
