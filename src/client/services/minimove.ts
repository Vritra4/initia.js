/**
 * Minimove rollup services.
 *
 * Includes:
 * - Common: auth, bank, tx, tendermint
 * - Minimove-specific: move, opchild
 *
 * Source imports: @buf/cosmos_cosmos-sdk, @buf/initia-labs_initia (move), @buf/initia-labs_opinit (opchild)
 */

import { createCommonRegistry } from './common'

// Initia move service
import { Query as MoveQuery } from '@buf/initia-labs_initia.bufbuild_es/initia/move/v1/query_pb'

// OPinit child
import { Query as OpchildQuery } from '@buf/initia-labs_opinit.bufbuild_es/opinit/opchild/v1/query_pb'

export const MinimoveServices = createCommonRegistry()
  .add('move', MoveQuery)
  .add('opchild', OpchildQuery)
