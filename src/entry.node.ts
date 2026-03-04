/**
 * Node.js entry point for initia.js
 *
 * Uses native gRPC over HTTP/2 for optimal performance.
 * All APIs are synchronous (no async transport creation needed).
 */

export * from './index'

// Node.js-only providers (uses node:fs, not available in browser builds)
export {
  LocalRegistryProvider,
  createLocalRegistryProvider,
  type LocalRegistryProviderOptions,
} from './provider/local-registry-provider'

import type { ChainInfo } from './provider/types'
import type { TransportOptions } from './client/transport-common'
import type { Key } from './key'
import type { ChainInfoProvider } from './provider/types'
import { createTransport } from './client/transport.node'
import { createClientWithTransport } from './client/client'
import { getServicesForChain } from './client/services'
import { InitiaServices } from './client/services/initia'
import { MinievmServices } from './client/services/minievm'
import { MiniwasmServices } from './client/services/miniwasm'
import { MinimoveServices } from './client/services/minimove'
import { createMsgs } from './msgs'
import { initiaMsgs } from './msgs/initia'
import { minievmMsgs } from './msgs/minievm'
import { miniwasmMsgs } from './msgs/miniwasm'
import { minimoveMsgs } from './msgs/minimove'
import type { Client } from './client/types'
import { buildChainContextFactory } from './wallet/chain-context'
import { buildTypedFactory, L1_CHAIN_IDS } from './wallet/typed-context'
import { buildFromChain } from './client/from-chain'
import { Wallet } from './wallet/wallet'
import {
  resolveTokenContract,
  type EvmEnabled,
  type WasmEnabled,
  type MoveEnabled,
} from './token/resolver'
import { createErc20Token } from './token/erc20'
import { createCw20Token } from './token/cw20'
import { createFungibleAssetToken } from './token/fungible-asset'

export { createTransport }

/**
 * Create a ChainContext from chain info (Node.js).
 *
 * Uses native gRPC over HTTP/2 transport.
 */
export const createChainContext = /* @__PURE__ */ buildChainContextFactory(
  createTransport,
  getServicesForChain,
  createMsgs,
  {
    // Generic path: assert client to all VM interfaces, narrow chainType to satisfy overload resolution.
    // Safe: resolveTokenContract's implementation dispatches on actual chainType at runtime.
    tokenResolver: (client, chainType, token, sender) =>
      resolveTokenContract(
        client as EvmEnabled & WasmEnabled & MoveEnabled,
        chainType as 'minievm',
        token,
        sender
      ),
  }
)

/**
 * Typed context factories — create ChainContext without generic params.
 *
 * Each supports three calling styles:
 * - `await createInitiaContext({ network: 'testnet', signer: key })` — all-in-one
 * - `createInitiaContext(provider, chainId, { signer: key })` — reuse provider
 * - `createInitiaContext(chainInfo, { signer: key })` — direct chainInfo
 *
 * Each factory imports only its own chain's services and msgs,
 * enabling tree-shaking of unused chain types.
 */
// TokenResolver.client is `unknown` intentionally — keeps chain-context.ts decoupled from VM types for tree-shaking.
// Each typed factory asserts to the specific VM interface (EvmEnabled/WasmEnabled/MoveEnabled) at this boundary.
export const createInitiaContext = /* @__PURE__ */ buildTypedFactory(
  'initia',
  createTransport,
  InitiaServices,
  initiaMsgs,
  {
    getDefaultChainId: n => L1_CHAIN_IDS[n],
    tokenResolver: (_client, _ct, token) =>
      createFungibleAssetToken((_client as MoveEnabled).move, token),
  }
)
export const createMinievmContext = /* @__PURE__ */ buildTypedFactory(
  'minievm',
  createTransport,
  MinievmServices,
  minievmMsgs,
  {
    tokenResolver: (_client, _ct, token, sender) =>
      createErc20Token((_client as EvmEnabled).evm, token, sender),
  }
)
export const createMiniwasmContext = /* @__PURE__ */ buildTypedFactory(
  'miniwasm',
  createTransport,
  MiniwasmServices,
  miniwasmMsgs,
  {
    tokenResolver: (_client, _ct, token) => createCw20Token((_client as WasmEnabled).wasm, token),
  }
)
export const createMinimoveContext = /* @__PURE__ */ buildTypedFactory(
  'minimove',
  createTransport,
  MinimoveServices,
  minimoveMsgs,
  {
    tokenResolver: (_client, _ct, token) =>
      createFungibleAssetToken((_client as MoveEnabled).move, token),
  }
)

/**
 * Create a raw gRPC client from chain ID (Node.js).
 *
 * Uses native gRPC over HTTP/2 transport.
 */
export const fromChain = /* @__PURE__ */ buildFromChain(createTransport, getServicesForChain)

/**
 * Create a Wallet instance (Node.js).
 *
 * @param options - Wallet options (key and/or provider)
 * @returns Wallet instance wired with Node.js gRPC transport
 *
 * @example
 * ```typescript
 * import { createWallet, MnemonicKey } from 'initia.js'
 *
 * const wallet = createWallet({ key: new MnemonicKey({ mnemonic: '...' }), provider })
 * const ctx = wallet.chain('initiation-2')
 * ```
 */
export function createWallet(options?: { key?: Key; provider?: ChainInfoProvider }): Wallet {
  return new Wallet(createChainContext, options)
}

/**
 * Create a gRPC client from chain info.
 *
 * Uses native gRPC over HTTP/2 (Node.js).
 *
 * @param chainInfo - Chain configuration from provider
 * @param options - Transport options
 * @returns gRPC client with chain-appropriate services
 *
 * @example
 * ```typescript
 * import { createClient, createLocalRegistryProvider } from 'initia.js'
 *
 * const provider = createLocalRegistryProvider({ registryPath: '/path/to/initia-registry' })
 * const chainInfo = provider.getChainInfo('interwoven-1')
 * const client = createClient(chainInfo)
 *
 * const balance = await client.bank.balance({ address, denom: 'uinit' })
 * ```
 */
export function createClient(chainInfo: ChainInfo, options?: TransportOptions): Client {
  const transport = createTransport(chainInfo, options)
  return createClientWithTransport(chainInfo, transport)
}
