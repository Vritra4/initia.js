import { createChainConfig } from '../chain-config'

// Query services
import { Query as AuthQuery } from '@initia/initia-proto/cosmos/auth/v1beta1/query_pb'
import { Query as BankQuery } from '@initia/initia-proto/cosmos/bank/v1beta1/query_pb'
import { Service as TxService } from '@initia/initia-proto/cosmos/tx/v1beta1/service_pb'
import { Service as TendermintService } from '@initia/initia-proto/cosmos/base/tendermint/v1beta1/query_pb'

// Tx services
import { Msg as BankTxMsg } from '@initia/initia-proto/cosmos/bank/v1beta1/tx_pb'
import { Msg as IbcTransferTxMsg } from '@initia/initia-proto/ibc/applications/transfer/v1/tx_pb'
import { Msg as ChannelTxMsg } from '@initia/initia-proto/ibc/core/channel/v1/tx_pb'
import { Msg as ClientTxMsg } from '@initia/initia-proto/ibc/core/client/v1/tx_pb'
import { Msg as ConnectionTxMsg } from '@initia/initia-proto/ibc/core/connection/v1/tx_pb'
import { Msg as IbcFeeTxMsg } from '@initia/initia-proto/ibc/applications/fee/v1/tx_pb'
import { Msg as IcaControllerTxMsg } from '@initia/initia-proto/ibc/applications/interchain_accounts/controller/v1/tx_pb'
import { Msg as IcaHostTxMsg } from '@initia/initia-proto/ibc/applications/interchain_accounts/host/v1/tx_pb'
import { Msg as AuthzTxMsg } from '@initia/initia-proto/cosmos/authz/v1beta1/tx_pb'
import { Msg as FeegrantTxMsg } from '@initia/initia-proto/cosmos/feegrant/v1beta1/tx_pb'

// Type-only registrations (for Any decode)
import { file_cosmos_crypto_ed25519_keys } from '@initia/initia-proto/cosmos/crypto/ed25519/keys_pb'
import { file_cosmos_crypto_secp256k1_keys } from '@initia/initia-proto/cosmos/crypto/secp256k1/keys_pb'
import { file_cosmos_auth_v1beta1_auth } from '@initia/initia-proto/cosmos/auth/v1beta1/auth_pb'

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
    .addTypes(
      file_cosmos_crypto_ed25519_keys,
      file_cosmos_crypto_secp256k1_keys,
      file_cosmos_auth_v1beta1_auth,
    )
}
