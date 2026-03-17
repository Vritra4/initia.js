import { createChainConfig } from '../chain-config'

// Query services
import { Query as AuthQuery } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/auth/v1beta1/query_pb'
import { Query as BankQuery } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/bank/v1beta1/query_pb'
import { Service as TxService } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/tx/v1beta1/service_pb'
import { Service as TendermintService } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/base/tendermint/v1beta1/query_pb'

// Tx services
import { Msg as BankTxMsg } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/bank/v1beta1/tx_pb'
import { Msg as IbcTransferTxMsg } from '@buf/cosmos_ibc.bufbuild_es/ibc/applications/transfer/v1/tx_pb'
import { Msg as ChannelTxMsg } from '@buf/cosmos_ibc.bufbuild_es/ibc/core/channel/v1/tx_pb'
import { Msg as ClientTxMsg } from '@buf/cosmos_ibc.bufbuild_es/ibc/core/client/v1/tx_pb'
import { Msg as ConnectionTxMsg } from '@buf/cosmos_ibc.bufbuild_es/ibc/core/connection/v1/tx_pb'
import { Msg as IbcFeeTxMsg } from '@buf/cosmos_ibc.bufbuild_es/ibc/applications/fee/v1/tx_pb'
import { Msg as IcaControllerTxMsg } from '@buf/cosmos_ibc.bufbuild_es/ibc/applications/interchain_accounts/controller/v1/tx_pb'
import { Msg as IcaHostTxMsg } from '@buf/cosmos_ibc.bufbuild_es/ibc/applications/interchain_accounts/host/v1/tx_pb'
import { Msg as AuthzTxMsg } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/authz/v1beta1/tx_pb'
import { Msg as FeegrantTxMsg } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/feegrant/v1beta1/tx_pb'
import { Msg as GroupTxMsg } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/group/v1/tx_pb'
import { Msg as CrisisTxMsg } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/crisis/v1beta1/tx_pb'
import { Msg as UpgradeTxMsg } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/upgrade/v1beta1/tx_pb'
import { Msg as ConsensusTxMsg } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/consensus/v1/tx_pb'
import { Msg as AuthTxMsg } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/auth/v1beta1/tx_pb'
import { Msg as IbcHooksTxMsg } from '@buf/initia-labs_initia.bufbuild_es/initia/ibchooks/v1/tx_pb'
import { Msg as InterTxTxMsg } from '@buf/initia-labs_initia.bufbuild_es/initia/intertx/v1/tx_pb'

// Type-only registrations (for Any decode)
import { file_cosmos_crypto_ed25519_keys } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/crypto/ed25519/keys_pb'
import { file_cosmos_crypto_secp256k1_keys } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/crypto/secp256k1/keys_pb'
import { file_cosmos_auth_v1beta1_auth } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/auth/v1beta1/auth_pb'

export function createBaseConfig() {
  return createChainConfig()
    .addModule('auth', { query: AuthQuery })
    .addModule('bank', { query: BankQuery, tx: BankTxMsg })
    .addModule('tx', { query: TxService })
    .addModule('tendermint', { query: TendermintService })
    .addModule('ibc', { tx: IbcTransferTxMsg })
    .addModule('ibcCore', { tx: [ChannelTxMsg, ClientTxMsg, ConnectionTxMsg] as const })
    .addModule('ibcFee', { tx: IbcFeeTxMsg })
    .addModule('ibcIca', { tx: [IcaControllerTxMsg, IcaHostTxMsg] as const })
    .addModule('authz', { tx: AuthzTxMsg })
    .addModule('feegrant', { tx: FeegrantTxMsg })
    .addModule('group', { tx: GroupTxMsg })
    .addModule('crisis', { tx: CrisisTxMsg })
    .addModule('upgrade', { tx: UpgradeTxMsg })
    .addModule('consensus', { tx: ConsensusTxMsg })
    .addModule('cosmosAuth', { tx: AuthTxMsg })
    .addModule('ibcHooks', { tx: IbcHooksTxMsg })
    .addModule('interTx', { tx: InterTxTxMsg })
    .addTypes(
      file_cosmos_crypto_ed25519_keys,
      file_cosmos_crypto_secp256k1_keys,
      file_cosmos_auth_v1beta1_auth
    )
}
