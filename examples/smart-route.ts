/**
 * Example: Smart Routing — Cross-chain token transfers via Router API
 *
 * Demonstrates:
 * 1. Find optimal transfer route (route discovery)
 * 2. Handle OP Hook (ERC-20 decimal conversion, if required)
 * 3. Build transfer messages from route
 * 4. Execute multi-hop transactions
 * 5. Track transfer status
 *
 * Prerequisites:
 *   TEST_MNEMONIC env var with funded testnet wallet.
 *
 * Usage:
 *   npx tsx examples/smart-route.ts route
 *   npx tsx examples/smart-route.ts transfer
 *   npx tsx examples/smart-route.ts status <txHash> <chainId>
 */

import { createChainContext, MnemonicKey } from 'initia.js'
import { createRegistryProvider, type RegistryProvider } from 'initia.js/provider'
import { type SignedOpHook } from 'initia.js/bridge'
import { sendEvmTxAndWait } from 'initia.js/evm'
import { TEST_MNEMONIC } from './constants'

// Example: L2 (evm-1) → L1 (initiation-2)
const SOURCE_CHAIN = 'evm-1'
const SOURCE_DENOM = 'uinit'
const DEST_CHAIN = 'initiation-2'
const DEST_DENOM = 'uinit'
const AMOUNT = '1000000' // 1 INIT in minimal denomination

// =============================================================================
// 1. Route discovery — find optimal transfer path
// =============================================================================

async function routeExample(provider: RegistryProvider) {
  console.log('=== Route Discovery ===\n')

  const route = await provider.bridge.route({
    amount: AMOUNT,
    source: { chainId: SOURCE_CHAIN, denom: SOURCE_DENOM },
    dest: { chainId: DEST_CHAIN, denom: DEST_DENOM },
  })

  console.log(`Route: ${route.source.chainId} → ${route.dest.chainId}`)
  console.log(`Amount: ${route.amountIn} → ${route.amountOut}`)
  if (route.usdAmountIn) {
    console.log(`USD: $${route.usdAmountIn} → $${route.usdAmountOut}`)
  }
  console.log(`Operations: ${route.operations.length} step(s)`)

  for (const op of route.operations) {
    console.log(`  - ${op.type}: ${op.denomIn} → ${op.denomOut}`)
  }

  if (route.estimatedDurationSeconds) {
    console.log(`Estimated duration: ~${route.estimatedDurationSeconds}s`)
  }
  if (route.warnings?.length) {
    console.warn('Warnings:', route.warnings)
  }
  if (route.requiresOpHook) {
    console.log('Note: This route requires OP Hook signing (ERC-20 decimal conversion)')
  }
}

// =============================================================================
// 2. Full transfer — route → (OP Hook) → build msgs → execute → track
// =============================================================================

async function transferExample(provider: RegistryProvider) {
  console.log('=== Smart Route Transfer ===\n')

  const key = new MnemonicKey({ mnemonic: TEST_MNEMONIC })

  // Step 1: Find route
  console.log('Finding route...')
  const route = await provider.bridge.route({
    amount: AMOUNT,
    source: { chainId: SOURCE_CHAIN, denom: SOURCE_DENOM },
    dest: { chainId: DEST_CHAIN, denom: DEST_DENOM },
  })

  console.log(
    `Route found: ${route.operations.length} step(s), ~${route.estimatedDurationSeconds ?? '?'}s\n`
  )

  // Step 2: Handle OP Hook if required (ERC-20 6d ↔ 18d wrapping)
  let signedOpHook: SignedOpHook | undefined
  if (route.requiresOpHook) {
    console.log('OP Hook required — signing...')
    const hookResult = await provider.bridge.getOpHook({
      sourceAddress: key.address,
      sourceChainId: SOURCE_CHAIN,
      sourceDenom: SOURCE_DENOM,
      destAddress: key.address,
      destChainId: DEST_CHAIN,
      destDenom: DEST_DENOM,
    })
    signedOpHook = await provider.bridge.signOpHook(hookResult, key)
    console.log('OP Hook signed.\n')
  }

  // Step 3: Build transfer messages
  console.log('Building transfer messages...')
  const txs = await provider.bridge.buildTransferMsgs({
    route,
    addresses: [key.address, key.address], // same address on both chains
    slippageTolerance: '3', // 3%
    signedOpHook,
  })

  console.log(`Got ${txs.length} transaction(s) to execute.\n`)

  // Step 4: Execute each transaction sequentially
  let firstTxHash: string | undefined
  for (const tx of txs) {
    const chainInfo = provider.getChainInfo(tx.chainId)
    if (!chainInfo) throw new Error(`Chain ${tx.chainId} not found`)

    if (tx.cosmosMsgs) {
      console.log(`Signing on ${tx.chainId} (${tx.signerAddress})...`)
      const ctx = createChainContext(chainInfo, { signer: key })
      const result = await ctx.signAndBroadcast(tx.cosmosMsgs, {
        waitForConfirmation: true,
      })

      if (result.code !== 0) {
        throw new Error(`Transaction failed on ${tx.chainId}: ${result.rawLog}`)
      }

      console.log(`  Tx: ${result.txHash} (height: ${result.height})`)
      firstTxHash ??= result.txHash
    } else if (tx.evmTx) {
      // EVM native transaction — requires an EVM RPC endpoint for the chain
      const evmRpcUrl = chainInfo.evmRpc
      if (!evmRpcUrl) {
        console.log(`  [Skipped] No EVM RPC URL for chain ${tx.chainId}`)
        continue
      }
      console.log(`Signing EVM tx on ${tx.chainId} (${tx.signerAddress})...`)
      const result = await sendEvmTxAndWait({
        rpc: evmRpcUrl,
        privateKey: key.getPrivateKeyHex(),
        to: tx.evmTx.to as `0x${string}`,
        data: tx.evmTx.data as `0x${string}`,
        value: tx.evmTx.value ? BigInt(tx.evmTx.value) : undefined,
      })
      console.log(`  Tx: ${result.txHash} (block: ${result.blockNumber}, status: ${result.status})`)
      firstTxHash ??= result.txHash
    }
  }

  // Step 5: Track transfer
  if (firstTxHash) {
    console.log('\nRegistering for tracking...')
    await provider.bridge.trackTransfer(firstTxHash, txs[0].chainId)

    const status = await provider.bridge.getTransferStatus(firstTxHash, txs[0].chainId)
    console.log(`Transfer status: ${status.status}`)
  }

  console.log('\nTransfer complete!')
}

// =============================================================================
// 3. Check transfer status by txHash
// =============================================================================

async function statusExample(provider: RegistryProvider, txHash: string, chainId: string) {
  console.log('=== Transfer Status ===\n')

  const status = await provider.bridge.getTransferStatus(txHash, chainId)
  console.log(`Tx: ${status.txHash}`)
  console.log(`Status: ${status.status}`)
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  const provider = await createRegistryProvider({ network: 'testnet' })
  const demo = process.argv[2] || 'route'

  switch (demo) {
    case 'route':
      return routeExample(provider)
    case 'transfer':
      return transferExample(provider)
    case 'status': {
      const txHash = process.argv[3]
      const chainId = process.argv[4]
      if (!txHash || !chainId) {
        console.log('Usage: npx tsx examples/smart-route.ts status <txHash> <chainId>')
        return
      }
      return statusExample(provider, txHash, chainId)
    }
    default:
      console.log('Available demos: route, transfer, status')
  }
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
