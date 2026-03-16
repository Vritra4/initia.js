import { createBaseConfig } from './common'
import { Query as EvmQuery } from '@buf/initia-labs_minievm.bufbuild_es/minievm/evm/v1/query_pb'
import { Msg as EvmTxMsg } from '@buf/initia-labs_minievm.bufbuild_es/minievm/evm/v1/tx_pb'
import { Query as OpchildQuery } from '@buf/initia-labs_opinit.bufbuild_es/opinit/opchild/v1/query_pb'
import { Msg as OpchildTxMsg } from '@buf/initia-labs_opinit.bufbuild_es/opinit/opchild/v1/tx_pb'
import { Msg as NftTransferTxMsg } from '@buf/initia-labs_initia.bufbuild_es/ibc/applications/nft_transfer/v1/tx_pb'

export const minievmChain = createBaseConfig()
  .addModule('evm', { query: EvmQuery, tx: EvmTxMsg })
  .addModule('opchild', { query: OpchildQuery, tx: OpchildTxMsg })
  .addModule('nftTransfer', { tx: NftTransferTxMsg })
