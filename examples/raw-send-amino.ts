/**
 * Example: Send tokens using Amino signing (SIGN_MODE_LEGACY_AMINO_JSON)
 *
 * This example demonstrates how to:
 * 1. Connect to chain
 * 2. Create a wallet from mnemonic
 * 3. Fetch account info from chain
 * 4. Build a MsgSend message (protobuf)
 * 5. Convert to Amino format and sign
 * 6. Construct TxRaw with SIGN_MODE_LEGACY_AMINO_JSON
 * 7. Broadcast the transaction
 *
 * Amino signing is useful for:
 * - Ledger hardware wallet support
 * - Legacy wallet compatibility
 * - Human-readable sign documents
 */

import { MnemonicKey, createWallet, createInitiaContext } from 'initia.js'
import { packPubKey } from 'initia.js/util'
import { makeStdSignDoc, signAmino, toAmino, type StdFee } from 'initia.js/tx'
import { TEST_MNEMONIC, RECIPIENT } from './constants'
import { create, toBinary } from '@bufbuild/protobuf'
import { anyPack, anyIs, anyUnpack } from '@bufbuild/protobuf/wkt'
import { MsgSendSchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/bank/v1beta1/tx_pb'
import { CoinSchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/base/v1beta1/coin_pb'
import { BaseAccountSchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/auth/v1beta1/auth_pb'
import { BroadcastMode } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/tx/v1beta1/service_pb'
import {
  TxBodySchema,
  AuthInfoSchema,
  TxRawSchema,
  SignerInfoSchema,
  ModeInfoSchema,
  FeeSchema,
} from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/tx/v1beta1/tx_pb'
import { SignMode } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/tx/signing/v1beta1/signing_pb'

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

  // 3. Fetch account info from chain
  const accountResponse = await client.auth.account({ address: wallet.address })
  if (!accountResponse.account) {
    throw new Error('Account not found on chain')
  }

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

  // 4. Create MsgSend (protobuf format)
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

  // 5. Convert to Amino format and create sign doc
  const msgAmino = toAmino(MsgSendSchema, msgSend)
  console.log('Amino message:', JSON.stringify(msgAmino, null, 2))

  const fee: StdFee = {
    amount: [{ denom: 'uinit', amount: '10000' }],
    gas: '200000',
  }

  const signDoc = makeStdSignDoc(
    [msgAmino],
    fee,
    chainId,
    'Send 1 INIT via Amino',
    accountNumber,
    sequence
  )

  console.log('Sign doc:', JSON.stringify(signDoc, null, 2))

  // 6. Sign with Amino
  const signature = await signAmino(key, signDoc)
  console.log('Signature:', Array.from(signature, b => b.toString(16).padStart(2, '0')).join(''))

  // 7. Construct TxRaw for broadcast
  // Note: TxBody uses protobuf messages, but AuthInfo uses SIGN_MODE_LEGACY_AMINO_JSON
  const msgAny = anyPack(MsgSendSchema, msgSend)

  const txBody = create(TxBodySchema, {
    messages: [msgAny],
    memo: 'Send 1 INIT via Amino',
  })
  const bodyBytes = toBinary(TxBodySchema, txBody)

  // Create AuthInfo with SIGN_MODE_LEGACY_AMINO_JSON
  const pubKeyAny = packPubKey(key.publicKey, key.isEth ? 'ethsecp256k1' : 'secp256k1')
  const signerInfo = create(SignerInfoSchema, {
    publicKey: pubKeyAny,
    modeInfo: create(ModeInfoSchema, {
      sum: {
        case: 'single',
        value: { mode: SignMode.LEGACY_AMINO_JSON },
      },
    }),
    sequence,
  })

  const feeProto = create(FeeSchema, {
    amount: [{ denom: 'uinit', amount: '10000' }],
    gasLimit: 200000n,
  })

  const authInfo = create(AuthInfoSchema, {
    signerInfos: [signerInfo],
    fee: feeProto,
  })
  const authInfoBytes = toBinary(AuthInfoSchema, authInfo)

  // Create TxRaw
  const txRaw = create(TxRawSchema, {
    bodyBytes,
    authInfoBytes,
    signatures: [signature],
  })
  const txBytes = toBinary(TxRawSchema, txRaw)

  console.log('Tx bytes length:', txBytes.length)

  // 8. Broadcast transaction
  const result = await client.tx.broadcastTx({
    txBytes,
    mode: BroadcastMode.SYNC,
  })

  if (result.txResponse?.code !== 0) {
    throw new Error(`Broadcast failed: ${result.txResponse?.rawLog}`)
  }

  console.log('Tx hash:', result.txResponse?.txhash)
}

main().catch(console.error)
