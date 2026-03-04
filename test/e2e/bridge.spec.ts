/**
 * E2E Test: Cross-chain Bridge via Router API
 *
 * Tests smart routing for external EVM chain (Sepolia) ↔ Initia L2:
 *   1. Route discovery (Sepolia → L2 and L2 → Sepolia)
 *   2. Build transfer messages (including EVM native txs)
 *   3. Sign and send EVM transaction on Sepolia
 *   4. Track transfer status
 *
 * Environment variables:
 *   TEST_MNEMONIC       - Funded testnet wallet mnemonic (required, skips all if absent)
 *   TEST_BRIDGE_STRICT  - Set to "true" to fail instead of skip on missing prerequisites
 *   SEPOLIA_RPC_URL     - Sepolia RPC endpoint (default: https://1rpc.io/sepolia)
 *
 * Run:
 *   TEST_MNEMONIC="..." npm run test:bridge
 *   TEST_MNEMONIC="..." TEST_BRIDGE_STRICT=true npm run test:bridge
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { createRegistryProvider } from '../../src/provider/registry-provider'
import { MnemonicKey } from '../../src/key/mnemonic-key'
import { EvmRpcClient } from '../../src/client/evm-rpc'
import { sendEvmTxAndWait } from '../../src/tx/evm'
import type { RegistryProvider } from '../../src/provider/registry-provider'
import type { Route, TransferTx } from '../../src/bridge/types'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const TEST_MNEMONIC = process.env.TEST_MNEMONIC
const SKIP = !TEST_MNEMONIC
const STRICT = process.env.TEST_BRIDGE_STRICT === 'true'

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL ?? 'https://1rpc.io/sepolia'
const SEPOLIA_CHAIN_ID = '11155111'

// Router API route target: an Initia L2 with EVM support
const L2_CHAIN = 'evm-1'

// Small test amount: 0.0001 ETH in wei
const TEST_AMOUNT_WEI = '100000000000000' // 10^14 = 0.0001 ETH

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function log(msg: string) {
  console.log(`  [Bridge E2E] ${msg}`)
}

function skipUnless(condition: boolean, reason: string): boolean {
  if (condition) return false
  if (STRICT) {
    expect.fail(`[STRICT] ${reason}`)
  }
  log(`SKIP: ${reason}`)
  return true
}

function skipInfra(condition: boolean, reason: string): boolean {
  if (condition) return false
  log(`SKIP (infra): ${reason}`)
  return true
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe.skipIf(SKIP)('Bridge E2E: Sepolia ↔ L2', () => {
  let provider: RegistryProvider
  let key: MnemonicKey
  let sepoliaRpc: EvmRpcClient
  let senderEvmAddress: string

  beforeAll(async () => {
    provider = await createRegistryProvider({ network: 'testnet' })
    key = new MnemonicKey({ mnemonic: TEST_MNEMONIC! })
    sepoliaRpc = new EvmRpcClient(SEPOLIA_RPC_URL)
    senderEvmAddress = key.evmAddress
    log(`Sender EVM address: ${senderEvmAddress}`)
    log(`Sender Bech32 address: ${key.address}`)
  }, 30_000)

  // =========================================================================
  // Sepolia → L2 (Down direction)
  // =========================================================================

  describe('Down: Sepolia → L2', () => {
    let route: Route
    let txs: TransferTx[]

    it('should check Sepolia balance', async () => {
      const balance = await sepoliaRpc.getBalance(senderEvmAddress)
      log(`Sepolia ETH balance: ${balance} wei (${Number(balance) / 1e18} ETH)`)
      if (skipInfra(balance > 0n, 'no Sepolia ETH balance — fund wallet first')) return
      expect(balance).toBeGreaterThan(0n)
    }, 30_000)

    it('should find route from Sepolia to L2', async () => {
      route = await provider.bridge.route({
        amount: TEST_AMOUNT_WEI,
        source: { chainId: SEPOLIA_CHAIN_ID, denom: 'ethereum-native' },
        dest: { chainId: L2_CHAIN, denom: 'uinit' },
      })

      log(`Route found: ${route.operations.length} step(s)`)
      log(`  ${route.source.chainId} → ${route.dest.chainId}`)
      log(`  Amount: ${route.amountIn} → ${route.amountOut}`)
      if (route.warnings?.length) {
        log(`  Warnings: ${route.warnings.join(', ')}`)
      }

      expect(route.amountIn).toBe(TEST_AMOUNT_WEI)
      expect(route.operations.length).toBeGreaterThan(0)
    }, 60_000)

    it('should build transfer messages', async () => {
      if (skipUnless(!!route, 'no route found in previous step')) return

      txs = await provider.bridge.buildTransferMsgs({
        route,
        addresses: [senderEvmAddress, key.address],
        slippageTolerance: '5',
      })

      log(`Got ${txs.length} transaction(s) to execute`)
      for (const tx of txs) {
        const hasEvm = !!tx.evmTx
        const hasCosmos = !!tx.cosmosMsgs
        log(`  Chain ${tx.chainId}: ${hasEvm ? 'EVM' : hasCosmos ? 'Cosmos' : 'unknown'} tx`)
      }

      expect(txs.length).toBeGreaterThan(0)
    }, 60_000)

    it('should have an EVM tx for Sepolia', async () => {
      if (skipUnless(!!txs?.length, 'no txs from previous step')) return

      const sepoliaTx = txs.find(tx => tx.chainId === SEPOLIA_CHAIN_ID)
      if (skipUnless(!!sepoliaTx, 'no Sepolia tx found in txs')) return

      const evmTx = sepoliaTx!.evmTx
      log(`Sepolia tx: to=${evmTx?.to}, data=${evmTx?.data?.slice(0, 20)}...`)
      expect(evmTx).toBeDefined()
      expect(evmTx!.to).toMatch(/^0x[0-9a-fA-F]{40}$/)
      expect(evmTx!.data).toMatch(/^0x/)
    }, 30_000)

    it('should sign and send EVM tx on Sepolia', async () => {
      if (skipUnless(!!txs?.length, 'no txs from previous step')) return

      const sepoliaTx = txs.find(tx => tx.chainId === SEPOLIA_CHAIN_ID && tx.evmTx)
      if (skipUnless(!!sepoliaTx, 'no EVM tx for Sepolia')) return

      const evmTxData = sepoliaTx!.evmTx!

      // Check balance before sending
      const balance = await sepoliaRpc.getBalance(senderEvmAddress)
      if (
        skipInfra(balance > BigInt(TEST_AMOUNT_WEI) * 2n, 'insufficient Sepolia ETH for tx + gas')
      )
        return

      const result = await sendEvmTxAndWait({
        rpc: sepoliaRpc,
        privateKey: key.getPrivateKeyHex(),
        to: evmTxData.to as `0x${string}`,
        data: evmTxData.data as `0x${string}`,
        value: evmTxData.value ? BigInt(evmTxData.value) : undefined,
      })

      log(`EVM TX sent: ${result.txHash}`)
      log(`  Status: ${result.status}, Block: ${result.blockNumber}, Gas: ${result.gasUsed}`)
      expect(result.status).toBe('success')
    }, 120_000)
  })

  // =========================================================================
  // L2 → Sepolia (Up direction)
  // =========================================================================

  describe('Up: L2 → Sepolia', () => {
    let route: Route
    let txs: TransferTx[]

    it('should find route from L2 to Sepolia', async () => {
      route = await provider.bridge.route({
        amount: '1000000', // 1 INIT
        source: { chainId: L2_CHAIN, denom: 'uinit' },
        dest: { chainId: SEPOLIA_CHAIN_ID, denom: 'ethereum-native' },
      })

      log(`Route found: ${route.operations.length} step(s)`)
      log(`  ${route.source.chainId} → ${route.dest.chainId}`)
      log(`  Amount: ${route.amountIn} → ${route.amountOut}`)

      expect(route.amountIn).toBe('1000000')
      expect(route.operations.length).toBeGreaterThan(0)
    }, 60_000)

    it('should build transfer messages for withdrawal', async () => {
      if (skipUnless(!!route, 'no route found in previous step')) return

      txs = await provider.bridge.buildTransferMsgs({
        route,
        addresses: [key.address, senderEvmAddress],
        slippageTolerance: '5',
      })

      log(`Got ${txs.length} transaction(s) for withdrawal`)
      for (const tx of txs) {
        const hasEvm = !!tx.evmTx
        const hasCosmos = !!tx.cosmosMsgs
        log(
          `  Chain ${tx.chainId}: ${hasEvm ? 'EVM' : hasCosmos ? `Cosmos (${tx.cosmosMsgs!.length} msgs)` : 'unknown'} tx`
        )
      }

      expect(txs.length).toBeGreaterThan(0)
    }, 60_000)
  })

  // =========================================================================
  // EVM TX Utility Tests
  // =========================================================================

  describe('EVM TX utilities', () => {
    it('should get chain ID from Sepolia RPC', async () => {
      const chainId = await sepoliaRpc.getChainId()
      log(`Sepolia chain ID: ${chainId}`)
      expect(chainId).toBe(11155111n)
    }, 30_000)

    it('should get gas price from Sepolia RPC', async () => {
      const gasPrice = await sepoliaRpc.getGasPrice()
      log(`Sepolia gas price: ${gasPrice} wei (${Number(gasPrice) / 1e9} gwei)`)
      expect(gasPrice).toBeGreaterThan(0n)
    }, 30_000)

    it('should get transaction count (nonce) for sender', async () => {
      const nonce = await sepoliaRpc.getTransactionCount(senderEvmAddress)
      log(`Sender nonce: ${nonce}`)
      expect(nonce).toBeGreaterThanOrEqual(0n)
    }, 30_000)

    it('should estimate gas for simple ETH transfer', async () => {
      const balance = await sepoliaRpc.getBalance(senderEvmAddress)
      if (skipInfra(balance > 0n, 'no Sepolia balance for gas estimation')) return

      const gas = await sepoliaRpc.estimateGas({
        from: senderEvmAddress,
        to: senderEvmAddress, // self-transfer
        value: '0x1', // 1 wei
      })

      log(`Estimated gas for ETH transfer: ${gas}`)
      expect(gas).toBeGreaterThan(0n)
      expect(gas).toBeLessThan(100_000n) // simple transfer should be ~21000
    }, 30_000)

    it('should derive correct EVM address from key', () => {
      // Verify that getPrivateKeyHex() roundtrips correctly
      const hex = key.getPrivateKeyHex()
      expect(hex).toMatch(/^0x[0-9a-f]{64}$/)

      // Verify EVM address matches
      const recreated = new MnemonicKey({ mnemonic: TEST_MNEMONIC! })
      expect(recreated.evmAddress).toBe(senderEvmAddress)
    })
  })
})
