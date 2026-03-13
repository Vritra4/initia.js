/**
 * Common services shared by all chain types.
 *
 * Provides a base registry with auth, bank, tx, and tendermint services
 * that per-chain files extend with chain-specific services.
 */

import { createServiceRegistry } from '../service-registry'

// Cosmos SDK services
import { Query as AuthQuery } from '@initia/initia-proto/cosmos/auth/v1beta1/query_pb'
import { Query as BankQuery } from '@initia/initia-proto/cosmos/bank/v1beta1/query_pb'
import { Service as TxService } from '@initia/initia-proto/cosmos/tx/v1beta1/service_pb'
import { Service as TendermintService } from '@initia/initia-proto/cosmos/base/tendermint/v1beta1/query_pb'

// Common Any-wrapped types (crypto keys + base account)
import { file_cosmos_crypto_ed25519_keys } from '@initia/initia-proto/cosmos/crypto/ed25519/keys_pb'
import { file_cosmos_crypto_secp256k1_keys } from '@initia/initia-proto/cosmos/crypto/secp256k1/keys_pb'
import { file_cosmos_auth_v1beta1_auth } from '@initia/initia-proto/cosmos/auth/v1beta1/auth_pb'

// Common Msg types (for Tx response Any serialization)
import { file_cosmos_bank_v1beta1_tx } from '@initia/initia-proto/cosmos/bank/v1beta1/tx_pb'
import { file_cosmos_authz_v1beta1_tx } from '@initia/initia-proto/cosmos/authz/v1beta1/tx_pb'
import { file_cosmos_feegrant_v1beta1_tx } from '@initia/initia-proto/cosmos/feegrant/v1beta1/tx_pb'

// IBC Msg types
import { file_ibc_applications_transfer_v1_tx } from '@initia/initia-proto/ibc/applications/transfer/v1/tx_pb'
import { file_ibc_applications_fee_v1_tx } from '@initia/initia-proto/ibc/applications/fee/v1/tx_pb'
import { file_ibc_applications_interchain_accounts_controller_v1_tx } from '@initia/initia-proto/ibc/applications/interchain_accounts/controller/v1/tx_pb'
import { file_ibc_applications_interchain_accounts_host_v1_tx } from '@initia/initia-proto/ibc/applications/interchain_accounts/host/v1/tx_pb'
import { file_ibc_core_channel_v1_tx } from '@initia/initia-proto/ibc/core/channel/v1/tx_pb'
import { file_ibc_core_client_v1_tx } from '@initia/initia-proto/ibc/core/client/v1/tx_pb'
import { file_ibc_core_connection_v1_tx } from '@initia/initia-proto/ibc/core/connection/v1/tx_pb'

/**
 * Create a service registry pre-loaded with common services.
 *
 * Per-chain files chain additional `.addModule()` calls on the returned builder.
 */
export function createCommonRegistry() {
  return createServiceRegistry()
    .addModule('auth', AuthQuery)
    .addModule('bank', BankQuery, file_cosmos_bank_v1beta1_tx)
    .addModule('tx', TxService)
    .addModule('tendermint', TendermintService)
    .addTypes(
      file_cosmos_crypto_ed25519_keys,
      file_cosmos_crypto_secp256k1_keys,
      file_cosmos_auth_v1beta1_auth,
      file_cosmos_authz_v1beta1_tx,
      file_cosmos_feegrant_v1beta1_tx,
      file_ibc_applications_transfer_v1_tx,
      file_ibc_applications_fee_v1_tx,
      file_ibc_applications_interchain_accounts_controller_v1_tx,
      file_ibc_applications_interchain_accounts_host_v1_tx,
      file_ibc_core_channel_v1_tx,
      file_ibc_core_client_v1_tx,
      file_ibc_core_connection_v1_tx
    )
}
