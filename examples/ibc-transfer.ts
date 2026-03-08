/**
 * Example: IBC Transfer using High-Level API
 *
 * This example demonstrates cross-chain token transfers:
 * 1. Create key and context
 * 2. Use ctx.msgs.ibc.transfer() to build IBC MsgTransfer
 * 3. Use ctx.signAndBroadcast() for one-call transaction
 *
 * For Noble/Cosmos cross-chain transfers, see noble-ibc-transfer.ts.
 */

import { MnemonicKey, createInitiaContext, coin } from 'initia.js'
import { TEST_MNEMONIC } from './constants'

async function main() {
  // 1. Create key and context
  const key = new MnemonicKey({ mnemonic: TEST_MNEMONIC })
  const ctx = await createInitiaContext({ network: 'testnet', signer: key })

  if (!ctx.address) {
    throw new Error('Address not available')
  }

  console.log('Chain:', ctx.chainId)
  console.log('Sender:', ctx.address)

  // 2. Build IBC transfer message
  const msg = ctx.msgs.ibc.transfer({
    sender: ctx.address, // sender on source chain
    receiver: 'cosmos1receiver...', // recipient on destination chain
    token: coin('uinit', '1000000'), // 1 INIT
    sourceChannel: 'channel-0', // IBC channel to destination
    memo: 'IBC transfer from Initia',
    // Optional: custom timeout (default is 10 minutes)
    // timeoutTimestamp: BigInt(Date.now() + 30 * 60 * 1000) * 1_000_000n,
  })

  // 3. Sign and broadcast
  const result = await ctx.signAndBroadcast([msg], {
    memo: 'IBC Transfer',
    fee: [coin('uinit', '25000')],
    gasLimit: 250000,
  })

  console.log('Tx hash:', result.txHash)
  console.log('Gas used:', result.gasUsed)
}

main().catch(console.error)
