/**
 * Minimove rollup message builders.
 *
 * Includes Move VM execution messages only.
 * Minimove uses the same Move VM as Initia L1.
 */

import type { MinimoveMsgs } from './types'
import { baseMsgs } from './base'
import { execute, script } from './move'

/**
 * Minimove rollup message builders instance.
 * Extends base messages with Move VM execution.
 */
export const minimoveMsgs: MinimoveMsgs = {
  ...baseMsgs,
  execute,
  script,
}
