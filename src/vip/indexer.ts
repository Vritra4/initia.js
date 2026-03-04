import { fetchJson } from '../util/fetch'
import { VIP_API_BASE_URLS } from './constants'
import type { VipIndexer, VipIndexerOptions, VestingPosition } from './types'

// =============================================================================
// Raw response type — snake_case from VIP API
// =============================================================================

interface RawVestingPosition {
  bridge_id: number
  version: number
  start_stage: number
  end_stage: number
  reward: string
  merkle_proofs: string[][]
  l2_score: string
}

// =============================================================================
// Factory
// =============================================================================

/**
 * Creates a VIP API client for fetching merkle proofs and vesting positions.
 *
 * @param options - Network selection or custom base URL
 * @returns VipIndexer instance
 */
export function createVipIndexer(options?: VipIndexerOptions): VipIndexer {
  const baseUrl = options?.baseUrl ?? VIP_API_BASE_URLS[options?.network ?? 'mainnet']

  if (!baseUrl) {
    throw new Error(`Unknown VIP API network: ${options?.network}`)
  }

  return {
    async getVestingPositions(address: string): Promise<VestingPosition[]> {
      const raw = await fetchJson<RawVestingPosition[]>(`${baseUrl}/vesting/positions/${address}`)
      return raw.map(normalizeVestingPosition)
    },
  }
}

// =============================================================================
// Normalization
// =============================================================================

function normalizeVestingPosition(raw: RawVestingPosition): VestingPosition {
  return {
    bridgeId: raw.bridge_id,
    version: raw.version,
    startStage: raw.start_stage,
    endStage: raw.end_stage,
    reward: BigInt(raw.reward),
    merkleProofs: raw.merkle_proofs,
    l2Score: raw.l2_score,
  }
}
