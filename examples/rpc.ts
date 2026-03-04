/**
 * CometBFT RPC — accessing data not available via gRPC.
 *
 * Demonstrates:
 * - block_results (finalize_block_events, validator_updates)
 * - tx with block index
 * - txSearch with TMQL queries
 *
 * Uses ctx.rpc (high-level ChainContext API).
 */
import { createInitiaContext } from 'initia.js'

const ctx = await createInitiaContext()

// 1. Node status
const status = await ctx.rpc.status()
console.log('Network:', status.node_info.network)
console.log('Latest height:', status.sync_info.latest_block_height)
console.log('Catching up:', status.sync_info.catching_up)

const latestHeight = Number(status.sync_info.latest_block_height) - 1

// 2. Block results — the main feature not available via gRPC
const results = await ctx.rpc.blockResults(latestHeight)
console.log('\n--- Block Results (height:', results.height, ') ---')
console.log('Tx count:', results.txs_results?.length ?? 0)
console.log('Finalize events:', results.finalize_block_events?.length ?? 0)

// Show finalize_block_events (staking rewards, slashing, etc.)
for (const event of results.finalize_block_events ?? []) {
  console.log(`  [${event.type}]`, event.attributes.map(a => `${a.key}=${a.value}`).join(', '))
}

// Show per-tx results
for (const [i, tx] of (results.txs_results ?? []).entries()) {
  console.log(`  tx[${i}]: code=${tx.code} gas=${tx.gas_used}/${tx.gas_wanted}`)
}

// 3. Search txs by height
const search = await ctx.rpc.txSearch(`tx.height=${latestHeight}`, { perPage: 5 })
console.log('\n--- Tx Search ---')
console.log(`Found ${search.total_count} txs at height ${latestHeight}`)
for (const tx of search.txs) {
  console.log(`  ${tx.hash} index=${tx.index} code=${tx.tx_result.code}`)
}

// 4. Single tx with index (not available via gRPC)
if (search.txs.length > 0) {
  const txDetail = await ctx.rpc.tx(search.txs[0].hash)
  console.log('\n--- Tx Detail ---')
  console.log('Hash:', txDetail.hash)
  console.log('Block index:', txDetail.index, '(not available via gRPC)')
  console.log('Height:', txDetail.height)
  console.log('Code:', txDetail.tx_result.code)
  console.log('Gas:', txDetail.tx_result.gas_used, '/', txDetail.tx_result.gas_wanted)
}
