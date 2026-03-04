/**
 * Example: Low-Level Send using raw Proto messages
 *
 * This example shows how to build transactions at the protocol level:
 * 1. Create protobuf messages directly (MsgSendSchema, CoinSchema)
 * 2. Pack messages as Any (anyPack)
 * 3. Manually fetch account info and manage sequence
 * 4. Sign and broadcast with full control
 *
 * For most use cases, prefer send.ts (high-level API).
 * Use this pattern when you need direct proto-level control.
 */

import { MnemonicKey, createWallet, createInitiaContext } from 'initia.js'
import { TEST_MNEMONIC, RECIPIENT } from './constants'
import { create } from '@bufbuild/protobuf'
import { anyPack, anyIs, anyUnpack } from '@bufbuild/protobuf/wkt'
import { MsgSendSchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/bank/v1beta1/tx_pb'
import { CoinSchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/base/v1beta1/coin_pb'
import { BaseAccountSchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/auth/v1beta1/auth_pb'
import { BroadcastMode } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/tx/v1beta1/service_pb'

async function main() {
  // 1. Connect to chain
  const ctx = await createInitiaContext({ network: 'testnet' })
  const client = ctx.client
  const chainId = ctx.chainId
  console.log('Connected to:', chainId)

  // 2. Create wallet from mnemonic
  const key = new MnemonicKey({ mnemonic: TEST_MNEMONIC })
  const wallet = createWallet({ key })

  console.log('Address:', wallet.address)
  console.log('EVM Address:', wallet.evmAddress)

  // 3. Fetch account info from chain
  const accountResponse = await client.auth.account({ address: wallet.address })
  if (!accountResponse.account) {
    throw new Error('Account not found on chain')
  }

  // Parse BaseAccount from Any (handles both BaseAccount and wrapped types)
  let accountNumber: bigint
  let sequence: bigint

  if (anyIs(accountResponse.account, BaseAccountSchema)) {
    const baseAccount = anyUnpack(accountResponse.account, BaseAccountSchema)
    if (!baseAccount) {
      throw new Error('Failed to unpack BaseAccount')
    }
    accountNumber = baseAccount.accountNumber
    sequence = baseAccount.sequence
  } else {
    throw new Error(`Unsupported account type: ${accountResponse.account.typeUrl}`)
  }

  console.log('Account number:', accountNumber)
  console.log('Sequence:', sequence)

  // 4. Create MsgSend
  const msgSend = create(MsgSendSchema, {
    fromAddress: wallet.address,
    toAddress: RECIPIENT.bech32,
    amount: [
      create(CoinSchema, {
        denom: 'uinit',
        amount: '1000000', // 1 INIT
      }),
    ],
  })

  // 5. Pack message as Any
  const msgAny = anyPack(MsgSendSchema, msgSend)

  // 6. Create and sign transaction
  const signedTx = await wallet.createAndSignTx(
    {
      msgs: [msgAny],
      memo: 'Send 1 INIT',
      fee: [{ denom: 'uinit', amount: '10000' }],
      gasLimit: 200000,
    },
    {
      chainId,
      accountNumber,
      sequence,
    }
  )

  console.log('Tx bytes length:', signedTx.txBytes.length)
  console.log(
    'Signature:',
    Array.from(signedTx.signature, b => b.toString(16).padStart(2, '0')).join('')
  )

  // 7. Broadcast transaction
  const result = await client.tx.broadcastTx({
    txBytes: signedTx.txBytes,
    mode: BroadcastMode.SYNC,
  })

  if (result.txResponse?.code !== 0) {
    throw new Error(`Broadcast failed: ${result.txResponse?.rawLog}`)
  }

  console.log('Tx hash:', result.txResponse?.txhash)
  console.log('Gas used:', result.txResponse?.gasUsed)
}

main().catch(console.error)
