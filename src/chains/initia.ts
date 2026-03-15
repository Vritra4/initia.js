import { createBaseConfig } from './common'

// Query services
import { Query as MoveQuery } from '@initia/initia-proto/initia/move/v1/query_pb'
import { Query as MstakingQuery } from '@initia/initia-proto/initia/mstaking/v1/query_pb'
import { Query as DistributionQuery } from '@initia/initia-proto/initia/distribution/v1/query_pb'
import { Query as GovQuery } from '@initia/initia-proto/cosmos/gov/v1/query_pb'
import { Query as GovV1Beta1Query } from '@initia/initia-proto/cosmos/gov/v1beta1/query_pb'
import { Query as OphostQuery } from '@initia/opinit-proto/opinit/ophost/v1/query_pb'

// Tx services — full modules (query + tx)
import { Msg as MoveTxMsg } from '@initia/initia-proto/initia/move/v1/tx_pb'
import { Msg as MstakingTxMsg } from '@initia/initia-proto/initia/mstaking/v1/tx_pb'
import { Msg as DistributionTxMsg } from '@initia/initia-proto/cosmos/distribution/v1beta1/tx_pb'
import { Msg as GovTxMsg } from '@initia/initia-proto/cosmos/gov/v1/tx_pb'
import { Msg as OphostTxMsg } from '@initia/opinit-proto/opinit/ophost/v1/tx_pb'

// Tx services — tx-only modules
import { Msg as RewardTxMsg } from '@initia/initia-proto/initia/reward/v1/tx_pb'
import { Msg as InitiaBankTxMsg } from '@initia/initia-proto/initia/bank/v1/tx_pb'
import { Msg as DynamicFeeTxMsg } from '@initia/initia-proto/initia/dynamicfee/v1/tx_pb'
import { Msg as IbcHooksTxMsg } from '@initia/initia-proto/initia/ibchooks/v1/tx_pb'
import { Msg as InterTxTxMsg } from '@initia/initia-proto/initia/intertx/v1/tx_pb'
import { Msg as InitiaDistributionTxMsg } from '@initia/initia-proto/initia/distribution/v1/tx_pb'
import { Msg as InitiaGovTxMsg } from '@initia/initia-proto/initia/gov/v1/tx_pb'
import { Msg as SlashingTxMsg } from '@initia/initia-proto/cosmos/slashing/v1beta1/tx_pb'
import { Msg as EvidenceTxMsg } from '@initia/initia-proto/cosmos/evidence/v1beta1/tx_pb'
import { Msg as UpgradeTxMsg } from '@initia/initia-proto/cosmos/upgrade/v1beta1/tx_pb'
import { Msg as ConsensusTxMsg } from '@initia/initia-proto/cosmos/consensus/v1/tx_pb'
import { Msg as GroupTxMsg } from '@initia/initia-proto/cosmos/group/v1/tx_pb'
import { Msg as CrisisTxMsg } from '@initia/initia-proto/cosmos/crisis/v1beta1/tx_pb'
import { Msg as AuthTxMsg } from '@initia/initia-proto/cosmos/auth/v1beta1/tx_pb'
import { Msg as VestingTxMsg } from '@initia/initia-proto/cosmos/vesting/v1beta1/tx_pb'
import { Msg as NftTransferTxMsg } from '@initia/initia-proto/ibc/applications/nft_transfer/v1/tx_pb'
import { Msg as PermTxMsg } from '@initia/initia-proto/ibc/applications/perm/v1/tx_pb'

// Gov legacy (testnet override)
import { Msg as GovV1Beta1TxMsg } from '@initia/initia-proto/cosmos/gov/v1beta1/tx_pb'

// Type-only registrations
import { file_initia_crypto_v1beta1_ethsecp256k1_keys } from '@initia/initia-proto/initia/crypto/v1beta1/ethsecp256k1/keys_pb'
import { file_initia_move_v1_auth } from '@initia/initia-proto/initia/move/v1/auth_pb'

export const initiaChain = createBaseConfig()
  .addModule('move', { query: MoveQuery, tx: MoveTxMsg })
  .addModule('mstaking', { query: MstakingQuery, tx: MstakingTxMsg })
  .addModule('distribution', { query: DistributionQuery, tx: DistributionTxMsg })
  .addModule('gov', { query: GovQuery, tx: GovTxMsg })
  .addModule('ophost', { query: OphostQuery, tx: OphostTxMsg })
  .addModule('reward', { tx: RewardTxMsg })
  .addModule('initiaBank', { tx: InitiaBankTxMsg })
  .addModule('dynamicFee', { tx: DynamicFeeTxMsg })
  .addModule('ibcHooks', { tx: IbcHooksTxMsg })
  .addModule('interTx', { tx: InterTxTxMsg })
  .addModule('initiaDistribution', { tx: InitiaDistributionTxMsg })
  .addModule('initiaGov', { tx: InitiaGovTxMsg })
  .addModule('slashing', { tx: SlashingTxMsg })
  .addModule('evidence', { tx: EvidenceTxMsg })
  .addModule('upgrade', { tx: UpgradeTxMsg })
  .addModule('consensus', { tx: ConsensusTxMsg })
  .addModule('group', { tx: GroupTxMsg })
  .addModule('crisis', { tx: CrisisTxMsg })
  .addModule('cosmosAuth', { tx: AuthTxMsg })
  .addModule('vesting', { tx: VestingTxMsg })
  .addModule('nftTransfer', { tx: NftTransferTxMsg })
  .addModule('perm', { tx: PermTxMsg })
  .forNetwork('testnet')
    .addModule('gov', { query: GovV1Beta1Query, tx: GovV1Beta1TxMsg })
  .addTypes(
    file_initia_crypto_v1beta1_ethsecp256k1_keys,
    file_initia_move_v1_auth,
  )
