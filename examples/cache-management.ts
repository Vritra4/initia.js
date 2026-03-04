/**
 * Example: Cache Management
 *
 * This example demonstrates how caching works in initia.js:
 * 1. Automatic ABI caching (Move modules, EVM contracts)
 * 2. Denom↔Contract bidirectional caching
 * 3. Request deduplication (concurrent calls share one network request)
 * 4. Using clearCache() after contract deployments
 * 5. Multi-chain cache isolation
 *
 * Cached data:
 * - Move module ABI (immutable after deployment)
 * - EVM denom↔contract mappings (immutable)
 *
 * Cache is in-memory LRU with 500 entries per type.
 * Immutable data (e.g., denom mappings) has no TTL; upgradeable Move modules use TTL (default 5 min).
 */

import { createInitiaContext } from 'initia.js'
import { createMoveContract } from 'initia.js/move'

// =============================================================================
// 1. Automatic ABI Caching
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- chain type narrowed at runtime
async function abiCachingExample(ctx: any) {
  console.log('=== ABI Caching Demo ===\n')

  // First call: Fetches ABI from network
  console.log('First call (network fetch)...')
  const start1 = performance.now()
  await createMoveContract(ctx, '0x1', 'coin')
  const time1 = performance.now() - start1
  console.log(`  Created contract in ${time1.toFixed(2)}ms`)

  // Second call: Uses cached ABI (no network)
  console.log('\nSecond call (cached)...')
  const start2 = performance.now()
  await createMoveContract(ctx, '0x1', 'coin')
  const time2 = performance.now() - start2
  console.log(`  Created contract in ${time2.toFixed(2)}ms`)

  // Cache hit is much faster
  console.log(`\nSpeedup: ${(time1 / time2).toFixed(1)}x faster with cache`)

  // Different module = different cache entry
  console.log('\nDifferent module (network fetch)...')
  const start3 = performance.now()
  await createMoveContract(ctx, '0x1', 'fungible_asset')
  const time3 = performance.now() - start3
  console.log(`  Created contract in ${time3.toFixed(2)}ms`)
}

// =============================================================================
// 2. Request Deduplication
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function deduplicationExample(ctx: any) {
  console.log('\n=== Request Deduplication Demo ===\n')

  // Clear cache first to demonstrate deduplication
  ctx.client.clearCache()

  // Fire 5 concurrent requests for the same module
  console.log('Firing 5 concurrent requests for 0x1::coin...')
  const start = performance.now()

  const results = await Promise.all([
    createMoveContract(ctx, '0x1', 'coin'),
    createMoveContract(ctx, '0x1', 'coin'),
    createMoveContract(ctx, '0x1', 'coin'),
    createMoveContract(ctx, '0x1', 'coin'),
    createMoveContract(ctx, '0x1', 'coin'),
  ])

  const elapsed = performance.now() - start
  console.log(`  All 5 completed in ${elapsed.toFixed(2)}ms`)
  console.log(`  (Only 1 network request was made - others joined the inflight request)`)

  // All results are the same
  const allSame = results.every(r => r.abi === results[0].abi)
  console.log(`  All results identical: ${allSame}`)
}

// =============================================================================
// 3. clearCache() Usage
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function clearCacheExample(ctx: any) {
  console.log('\n=== clearCache() Demo ===\n')

  // Populate cache
  console.log('Populating cache...')
  await createMoveContract(ctx, '0x1', 'coin')
  await createMoveContract(ctx, '0x1', 'fungible_asset')
  console.log('  Cache populated with 2 modules')

  // Verify cache is working
  const start1 = performance.now()
  await createMoveContract(ctx, '0x1', 'coin')
  const cached = performance.now() - start1
  console.log(`  Cached lookup: ${cached.toFixed(2)}ms`)

  // Clear cache (e.g., after deploying new contract version)
  console.log('\nClearing cache...')
  ctx.client.clearCache()
  console.log('  Cache cleared')

  // Next call will fetch from network again
  const start2 = performance.now()
  await createMoveContract(ctx, '0x1', 'coin')
  const fresh = performance.now() - start2
  console.log(`  Fresh lookup after clear: ${fresh.toFixed(2)}ms`)
}

// =============================================================================
// 4. When to Clear Cache
// =============================================================================

/**
 * Use clearCache() in these scenarios:
 *
 * 1. After deploying/upgrading a contract
 *    - Move module upgrade changes ABI
 *    - New EVM contract deployment
 *
 * 2. After creating new denom↔contract mappings
 *    - Creating new ERC20 wrapper
 *
 * 3. When switching chain contexts
 *    - Each client has its own cache (chainId-isolated)
 *    - But if reusing client object for different chain, clear first
 *
 * 4. During testing
 *    - Ensure fresh state between test cases
 */

async function whenToClearExample() {
  console.log('\n=== When to Clear Cache ===\n')

  // Scenario: After deploying a new Move module
  console.log('Scenario: Contract upgrade workflow')
  console.log('  1. Deploy new module version')
  console.log('  2. ctx.client.clearCache()  // Clear stale ABI')
  console.log('  3. createMoveContract(ctx, ...) // Fetch fresh ABI')

  // Code example (commented - would need actual deployment)
  /*
  const ctx = await createInitiaContext({ network: 'testnet' })

  // Before upgrade
  const oldContract = await createMoveContract(ctx, addr, 'my_module')

  // ... deploy new version ...

  // Clear cache to get new ABI
  ctx.client.clearCache()

  // Now gets fresh ABI with new functions
  const newContract = await createMoveContract(ctx, addr, 'my_module')
  */
}

// =============================================================================
// 5. Multi-Chain Cache Isolation
// =============================================================================

async function multiChainExample() {
  console.log('\n=== Multi-Chain Cache Isolation ===\n')

  // Each chain has its own isolated cache
  // Cache keys include chainId: `${chainId}:move:${addr}:${module}`

  console.log('Cache keys are prefixed with chainId:')
  console.log('  initiation-2:move:0x1:coin')
  console.log('  move-1:move:0x1:coin')
  console.log('')
  console.log('This means:')
  console.log('  - Same module address on different chains = separate cache entries')
  console.log('  - No cross-chain cache pollution')
  console.log("  - clearCache() only affects that client's chain")

  // Example with two chains (if you have access to multiple)
  /*
  const ctx1 = await createInitiaContext({ network: 'testnet' })
  const ctx2 = await createMinimoveContext({ network: 'testnet', chainId: 'move-1' })

  // These are cached separately
  await createMoveContract(ctx1, '0x1', 'coin')
  await createMoveContract(ctx2, '0x1', 'coin')

  // Clearing ctx1 doesn't affect ctx2
  ctx1.client.clearCache()
  */
}

// =============================================================================
// 6. Denom↔Contract Caching (Minievm)
// =============================================================================

async function denomCachingExample() {
  console.log('\n=== Denom↔Contract Caching (Minievm) ===\n')

  console.log('On Minievm chains, denom↔contract mappings are cached bidirectionally:')
  console.log('')
  console.log('  // First call - network fetch')
  console.log('  const addr = await ctx.client.evm.contractAddrByDenom({ denom: "uusdc" })')
  console.log('')
  console.log('  // Second call - cached (no network)')
  console.log('  const addr2 = await ctx.client.evm.contractAddrByDenom({ denom: "uusdc" })')
  console.log('')
  console.log('  // Reverse lookup - also cached from first call!')
  console.log('  const denom = await ctx.client.evm.denom({ contractAddr: addr })')
  console.log('')
  console.log('Bidirectional caching means one lookup populates both directions.')

  // Actual example (requires minievm chain)
  /*
  const evmCtx = await createMinievmContext({ network: 'testnet', chainId: 'evm-1' })

  // This caches both denom→contract AND contract→denom
  const result = await evmCtx.client.evm.contractAddrByDenom({ denom: 'uusdc' })

  // This uses the reverse cache (no network call)
  const reverse = await evmCtx.client.evm.denom({ contractAddr: result.address })
  */
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  try {
    const ctx = await createInitiaContext({ network: 'testnet' })

    console.log('Connected to:', ctx.chainId)

    await abiCachingExample(ctx)
    await deduplicationExample(ctx)
    await clearCacheExample(ctx)
    await whenToClearExample()
    await multiChainExample()
    await denomCachingExample()

    console.log('\n=== Summary ===')
    console.log('- ABI is automatically cached after first fetch')
    console.log('- Concurrent requests share one network call')
    console.log('- Use ctx.client.clearCache() after contract deployments')
    console.log('- Each chain has isolated cache (chainId in key)')
    console.log('- Denom mappings are cached bidirectionally')
  } catch (error) {
    console.error('Error:', error)
  }
}

main().catch(console.error)
