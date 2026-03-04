/**
 * Base Cosmos SDK services for other chains.
 *
 * Includes standard Cosmos SDK services that work with any Cosmos chain:
 * - auth, bank, tx, tendermint
 *
 * Used by CosmosRegistryProvider chains (Osmosis, Noble, Cosmos Hub, etc.)
 *
 * Source imports: @buf/cosmos_cosmos-sdk only
 */

import { createCommonRegistry } from './common'

export const OtherServices = createCommonRegistry()
