/**
 * Client entry point (Browser) — injects gRPC-Web transport for fromChain.
 */

// client/client (backward compat — will be removed)
export { createClientWithTransport } from './client/client'

// client/grpc-client
export { createGrpcClient, type ServiceClients, type QueryClient } from './client/grpc-client'

// client/types
export { auth } from './client/types'
export type {
  ChainType,
  NetworkType,
  BaseClient,
  InitiaClient,
  MinievmClient,
  MiniwasmClient,
  MinimoveClient,
  Client,
  ClientFor,
  HasClient,
  HasEvmService,
  HasWasmService,
  HasMoveService,
  SignModeType,
  TxOptions,
  UnsignedTx,
  SignedTx,
  UsernamesSupportedNetwork,
  HasUsernames,
  AuthConfig,
  HttpRequestOptions,
  QueryOptions,
} from './client/types'

// client/from-chain — with browser transport
export { type FromChainOptions, type FromChainResult } from './client/from-chain'
import { createTransport } from './client/transport.browser'
import { buildFromChain } from './client/from-chain'
import { resolveServices, resolveRegistry } from './chains/resolve'
export const fromChain = /* @__PURE__ */ buildFromChain(createTransport, resolveServices, resolveRegistry)

// client/broadcast
export {
  broadcast,
  createBroadcastResultWithWait,
  type BroadcastResult,
  type BroadcastResultWithWait,
  type BroadcastMode,
  type BroadcastOptions,
  type SignBroadcastOptions,
  type TxClient,
} from './client/broadcast'

// client/gas
export {
  estimateGas,
  type GasEstimate,
  type EstimateOptions,
  type SimulateClient,
} from './client/gas'

// client/transport-common
export {
  createHeadersInterceptor,
  createRetryInterceptor,
  type TransportOptions,
  type RetryOptions,
  type Interceptor,
} from './client/transport-common'

// client/websocket (5 items only — rest goes to events subpath)
export {
  waitForTx,
  type WaitForTxOptions,
  type TxResult,
  type TxEvent,
  type TxQueryClient,
} from './client/websocket'

// client/address-profile
export {
  getAddressProfile,
  type AccountKind,
  type ContractKind,
  type AddressProfile,
  type EvmProfile,
  type ShorthandProfile,
  type EoaProfile,
  type MoveProfile,
  type WasmProfile,
  type GetAddressProfileOptions,
  type ProfileCache,
} from './client/address-profile'

// client/response
export {
  wrapResponse,
  isWrappedResponse,
  type WrappedResponse,
  type WrapReturnType,
} from './client/response'

// client/cached-client
export type { CachedClient } from './client/cached-client'

// client/rpc — CometBFT HTTP RPC
export {
  RpcClient,
  createRpcClient,
  type RpcClientOptions,
  type BlockResultsResponse,
  type RpcTxResponse,
  type RpcTxSearchResponse,
  type RpcStatusResponse,
  type RpcBlockResponse,
  type AbciEvent,
  type AbciEventAttribute,
  type ExecTxResult,
  type ValidatorUpdate,
  type ConsensusParams,
  type TxSearchOptions,
  type PaginationOptions,
  type RpcCommitResponse,
  type RpcValidatorsResponse,
  type RpcConsensusParamsResponse,
  type RpcBlockchainResponse,
  type RpcBlockMeta,
  type RpcBlockSearchResponse,
  type RpcUnconfirmedTxsResponse,
  type RpcNumUnconfirmedTxsResponse,
  type RpcAbciInfoResponse,
  type RpcHeaderResponse,
  type RpcConsensusStateResponse,
  type RpcDumpConsensusStateResponse,
  type RpcGenesisResponse,
  type RpcGenesisChunkedResponse,
  type RpcNetInfoResponse,
  type AbciQueryOptions,
  type RpcAbciQueryResponse,
} from './client/rpc'
