/**
 * Browser entry point for initia.js
 *
 * Uses gRPC-web transport compatible with all modern browsers.
 * All APIs are synchronous (no async transport creation needed).
 */

export * from './index'

import type { ChainInfo } from './provider/types'
import type { TransportOptions } from './client/transport-common'
import type { Key } from './key'
import type { ChainInfoProvider } from './provider/types'
import { createTransport } from './client/transport.browser'
import { createClientWithTransport } from './client/client'
import type { DescService } from '@bufbuild/protobuf'
import { initiaChain } from './chains/initia'
import { minievmChain } from './chains/minievm'
import { minimoveChain } from './chains/minimove'
import { miniwasmChain } from './chains/miniwasm'
import { createBaseConfig } from './chains/common'
import type { ChainConfigBuilder } from './chain-config'
import type { Client, ChainType } from './client/types'
import type { MsgsForChain } from './msgs/types'
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
import type { AbiRegistry } from './tx/get-tx'
import type { Abi } from 'abitype'
import type { MoveModuleAbi } from './contracts/move/types'
import { createMoveEnricher } from './tx/enrichers/move'
import { createEvmEnricher } from './tx/enrichers/evm'
import { createWasmEnricher } from './tx/enrichers/wasm'

export { createTransport }

const chainConfigs: Record<string, ChainConfigBuilder<any, any>> = {
  initia: initiaChain,
  minievm: minievmChain,
  minimove: minimoveChain,
  miniwasm: miniwasmChain,
}

/**
 * Create a ChainContext from chain info (browser).
 *
 * Uses gRPC-web transport.
 */
export const createChainContext = /* @__PURE__ */ buildChainContextFactory(
  createTransport,
  chainInfo => {
    const config = chainConfigs[chainInfo.chainType as keyof typeof chainConfigs]
    if (!config) return createBaseConfig().build().services as Record<string, DescService>
    const built = chainInfo.network ? config.build(chainInfo.network) : config.build()
    return built.services as Record<string, DescService>
  },
  (chainType: ChainType) => {
    const config = chainConfigs[chainType as keyof typeof chainConfigs]
    if (!config) return createBaseConfig().build().msgs as unknown as MsgsForChain<ChainType>
    return config.build().msgs as unknown as MsgsForChain<ChainType>
  },
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
    getTypeRegistry: chainInfo => {
      const config = chainConfigs[chainInfo.chainType as keyof typeof chainConfigs]
      if (!config) return createBaseConfig().build().registry
      const built = chainInfo.network ? config.build(chainInfo.network) : config.build()
      return built.registry
    },
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
  initiaChain,
  {
    getDefaultChainId: n => L1_CHAIN_IDS[n],
    tokenResolver: (_client, _ct, token) =>
      createFungibleAssetToken((_client as MoveEnabled).move, token),
    enricherFactory: (client, abis) => [
      createMoveEnricher(
        (client as unknown as MoveEnabled).move,
        abis as AbiRegistry<MoveModuleAbi>
      ),
    ],
  }
)
export const createMinievmContext = /* @__PURE__ */ buildTypedFactory(
  'minievm',
  createTransport,
  minievmChain,
  {
    tokenResolver: (_client, _ct, token, sender) =>
      createErc20Token((_client as EvmEnabled).evm, token, sender),
    enricherFactory: (_client, abis) => [createEvmEnricher(abis as AbiRegistry<Abi>)],
  }
)
export const createMiniwasmContext = /* @__PURE__ */ buildTypedFactory(
  'miniwasm',
  createTransport,
  miniwasmChain,
  {
    tokenResolver: (_client, _ct, token) => createCw20Token((_client as WasmEnabled).wasm, token),
    enricherFactory: () => [createWasmEnricher()],
  }
)
export const createMinimoveContext = /* @__PURE__ */ buildTypedFactory(
  'minimove',
  createTransport,
  minimoveChain,
  {
    tokenResolver: (_client, _ct, token) =>
      createFungibleAssetToken((_client as MoveEnabled).move, token),
    enricherFactory: (client, abis) => [
      createMoveEnricher(
        (client as unknown as MoveEnabled).move,
        abis as AbiRegistry<MoveModuleAbi>
      ),
    ],
  }
)

/**
 * Create a raw gRPC client from chain ID (browser).
 *
 * Uses gRPC-web transport.
 */
export const fromChain = /* @__PURE__ */ buildFromChain(
  createTransport,
  chainInfo => {
    const config = chainConfigs[chainInfo.chainType as keyof typeof chainConfigs]
    if (!config) return createBaseConfig().build().services as Record<string, DescService>
    const built = chainInfo.network ? config.build(chainInfo.network) : config.build()
    return built.services as Record<string, DescService>
  },
  chainInfo => {
    const config = chainConfigs[chainInfo.chainType as keyof typeof chainConfigs]
    if (!config) return createBaseConfig().build().registry
    const built = chainInfo.network ? config.build(chainInfo.network) : config.build()
    return built.registry
  }
)

/**
 * Create a Wallet instance (browser).
 *
 * @param options - Wallet options (key and/or provider)
 * @returns Wallet instance wired with gRPC-web transport
 */
export function createWallet(options?: { key?: Key; provider?: ChainInfoProvider }): Wallet {
  return new Wallet(createChainContext, options)
}

/**
 * Create a gRPC client from chain info.
 *
 * Uses gRPC-web transport (browser compatible).
 *
 * @param chainInfo - Chain configuration from provider
 * @param options - Transport options
 * @returns gRPC client with chain-appropriate services
 *
 * @example
 * ```typescript
 * import { createClient, createRegistryProvider } from 'initia.js'
 *
 * const provider = await createRegistryProvider()
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
