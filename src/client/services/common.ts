/**
 * Common services shared by all chain types.
 *
 * Provides a base registry with auth, bank, tx, and tendermint services
 * that per-chain files extend with chain-specific services.
 */

import { createServiceRegistry } from '../service-registry'

// Cosmos SDK services
import { Query as AuthQuery } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/auth/v1beta1/query_pb'
import { Query as BankQuery } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/bank/v1beta1/query_pb'
import { Service as TxService } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/tx/v1beta1/service_pb'
import { Service as TendermintService } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/base/tendermint/v1beta1/query_pb'

// Common Any-wrapped types (crypto keys + base account)
import { file_cosmos_crypto_ed25519_keys } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/crypto/ed25519/keys_pb'
import { file_cosmos_crypto_secp256k1_keys } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/crypto/secp256k1/keys_pb'
import { file_cosmos_auth_v1beta1_auth } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/auth/v1beta1/auth_pb'

/**
 * Create a service registry pre-loaded with common services.
 *
 * Per-chain files chain additional `.add()` calls on the returned builder.
 */
export function createCommonRegistry() {
  return createServiceRegistry()
    .add('auth', AuthQuery)
    .add('bank', BankQuery)
    .add('tx', TxService)
    .add('tendermint', TendermintService)
    .addTypes(
      file_cosmos_crypto_ed25519_keys,
      file_cosmos_crypto_secp256k1_keys,
      file_cosmos_auth_v1beta1_auth
    )
}
