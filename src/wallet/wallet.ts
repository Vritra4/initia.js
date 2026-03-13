/**
 * Wallet implementation for Initia SDK.
 *
 * Provides transaction creation, signing, and broadcasting capabilities.
 * Supports multiple chain contexts via optional ChainInfoProvider.
 *
 * Platform-agnostic: receives `createChainContext` (already wired with transport)
 * from the entry file factory.
 */

import type { Numeric } from '../types'
import { toBinary, create } from '@bufbuild/protobuf'
import {
  TxBodySchema,
  AuthInfoSchema,
  TxRawSchema,
  SignerInfoSchema,
  ModeInfoSchema,
  FeeSchema,
} from '@initia/initia-proto/cosmos/tx/v1beta1/tx_pb'
import { SignMode } from '@initia/initia-proto/cosmos/tx/signing/v1beta1/signing_pb'
import { bech32 } from '@scure/base'
import type { Key } from '../key'
import { DEFAULT_GAS_LIMIT } from '../constants'
import { packPubKey } from '../util/public-key'
import {
  makeSignBytes,
  signDirect,
  signAmino,
  signEIP191,
  makeStdSignDoc,
  type StdFee,
} from '../tx/sign'
import { type MsgInput, normalizeMsg } from '../msgs/types'
import type { SignModeType } from '../client/types'
import type { ChainInfo, ChainInfoProvider } from '../provider/types'
import { ChainNotFoundError } from '../errors'
import type { ChainContext, ChainContextOptions } from './chain-context'
import type { ChainType } from '../client/types'
import { WalletBridge } from './bridge'

// =============================================================================
// Types
// =============================================================================

/**
 * Function that creates a ChainContext from chain info.
 * Produced by `buildChainContextFactory(createTransport)` in entry files.
 */
export type CreateChainContextFn = <T extends ChainType>(
  chainInfo: ChainInfo & { chainType: T },
  options?: ChainContextOptions
) => ChainContext<T>

/**
 * Transaction creation options.
 */
export interface CreateTxOptions {
  /** Messages to include in the transaction */
  msgs: MsgInput[]
  /** Optional memo */
  memo?: string
  /** Fee amount (e.g., [{ denom: 'uinit', amount: '10000' }]) */
  fee?: { denom: string; amount: string }[]
  /** Gas limit */
  gasLimit?: Numeric
  /** Timeout block height (optional) */
  timeoutHeight?: Numeric
  /** Signing mode (default: 'direct') */
  signMode?: SignModeType
}

/**
 * Sign options for the wallet.
 */
export interface WalletSignOptions {
  /** Chain ID */
  chainId: string
  /** Account number on chain */
  accountNumber: Numeric
  /** Account sequence (nonce) */
  sequence: Numeric
}

/**
 * Signed transaction result.
 */
export interface SignedTx {
  /** Serialized TxRaw bytes ready for broadcast */
  txBytes: Uint8Array
  /** Body bytes (for reference) */
  bodyBytes: Uint8Array
  /** AuthInfo bytes (for reference) */
  authInfoBytes: Uint8Array
  /** Signature */
  signature: Uint8Array
}

/**
 * Wallet class for managing keys and signing transactions.
 *
 * Supports three modes:
 * - Query-only: No key - create ChainContext for queries only
 * - With key: Full signing capability
 *
 * @example Query-only (no key)
 * ```ts
 * const wallet = createWallet({ provider })
 *
 * const ctx = wallet.chain('initiation-2')
 * const balance = await ctx.getBalance({ address: someAddress, denom: 'uinit' })
 * ```
 *
 * @example With key for signing
 * ```ts
 * const key = new MnemonicKey({ mnemonic: '...' })
 * const wallet = createWallet({ key, provider })
 *
 * const ctx = wallet.chain('initiation-2')
 * await ctx.signAndBroadcast([msg])
 * ```
 *
 * @example With auth headers
 * ```ts
 * const wallet = createWallet({ key, provider })
 * const ctx = wallet.chain('initiation-2', { auth: auth.bearer('token') })
 * await ctx.signAndBroadcast([msg])
 * ```
 */
export class Wallet {
  readonly key: Key | undefined
  readonly provider: ChainInfoProvider | undefined
  private readonly _createChainContext: CreateChainContextFn

  /**
   * Create a new Wallet instance.
   *
   * @param createChainContext - Platform-specific ChainContext factory (injected by entry file)
   * @param options - Wallet options (key and/or provider)
   */
  constructor(
    createChainContext: CreateChainContextFn,
    options?: { key?: Key; provider?: ChainInfoProvider }
  ) {
    this._createChainContext = createChainContext
    this.key = options?.key
    this.provider = options?.provider
  }

  /**
   * Get the wallet's account address.
   * Returns undefined if no key is set.
   */
  get address(): string | undefined {
    return this.key?.address
  }

  /**
   * Get the wallet's validator address.
   * Returns undefined if no key is set.
   */
  get valAddress(): string | undefined {
    return this.key?.valAddress
  }

  /**
   * Get the wallet's EVM address.
   * Returns undefined if no key is set.
   */
  get evmAddress(): string | undefined {
    return this.key?.evmAddress
  }

  /**
   * Get the wallet's public key as Uint8Array.
   * Returns undefined if no key is set.
   */
  get publicKey(): Uint8Array | undefined {
    return this.key?.publicKey
  }

  /**
   * Check if this wallet has a signing key.
   */
  get hasKey(): boolean {
    return this.key !== undefined
  }

  /**
   * Get the required key, throwing if not available.
   * @throws Error if no key is set
   */
  private requireKey(): Key {
    if (!this.key) {
      throw new Error('No signing key available. Create wallet with key: createWallet({ key })')
    }
    return this.key
  }

  /**
   * Get account address with a specific bech32 prefix.
   *
   * @param prefix - Bech32 prefix (e.g., 'init', 'cosmos', 'osmo')
   * @returns Bech32 encoded address with the specified prefix
   * @throws Error if no key is set
   */
  getAddressWithPrefix(prefix: string): string {
    const key = this.requireKey()
    return bech32.encode(prefix, bech32.toWords(key.rawAddress))
  }

  /**
   * Get account address for a specific chain.
   * Requires provider to be set.
   *
   * @param chainId - Chain ID to get address for
   * @returns Bech32 encoded address with chain-specific prefix
   * @throws ChainNotFoundError if chain not found in provider
   * @throws Error if provider is not set
   */
  getAddress(chainId: string): string {
    if (!this.provider) {
      throw new Error(
        'Provider is required to get chain-specific address. Use getAddressWithPrefix() instead.'
      )
    }

    const chainInfo = this.provider.getChainInfo(chainId)
    if (!chainInfo) {
      throw new ChainNotFoundError(chainId)
    }

    const prefix = chainInfo.bech32Prefix ?? 'init'
    return this.getAddressWithPrefix(prefix)
  }

  /**
   * Create TxBody bytes from messages and options.
   *
   * @param options - Transaction options
   * @returns Serialized TxBody bytes
   */
  createTxBody(options: CreateTxOptions): Uint8Array {
    const msgs = options.msgs.map(m => normalizeMsg(m))
    const txBody = create(TxBodySchema, {
      messages: msgs.map(m => m.toAny()),
      memo: options.memo ?? '',
      timeoutHeight: BigInt(options.timeoutHeight ?? 0),
      extensionOptions: [],
      nonCriticalExtensionOptions: [],
    })

    return toBinary(TxBodySchema, txBody)
  }

  /**
   * Create AuthInfo bytes for signing.
   *
   * @param options - Transaction and sign options
   * @param signOptions - Sign options with sequence
   * @returns Serialized AuthInfo bytes
   * @throws Error if no key is set
   */
  createAuthInfo(options: CreateTxOptions, signOptions: WalletSignOptions): Uint8Array {
    const key = this.requireKey()
    const signMode = options.signMode ?? 'direct'

    const protoSignMode =
      signMode === 'amino'
        ? SignMode.LEGACY_AMINO_JSON
        : signMode === 'eip191'
          ? SignMode.LEGACY_AMINO_JSON
          : SignMode.DIRECT

    const pubKeyAny = packPubKey(key.publicKey, key.isEth ? 'ethsecp256k1' : 'secp256k1')

    const signerInfo = create(SignerInfoSchema, {
      publicKey: pubKeyAny,
      modeInfo: create(ModeInfoSchema, {
        sum: {
          case: 'single',
          value: { mode: protoSignMode },
        },
      }),
      sequence: BigInt(signOptions.sequence),
    })

    const fee = create(FeeSchema, {
      amount:
        options.fee?.map(coin => ({
          denom: coin.denom,
          amount: coin.amount,
        })) ?? [],
      gasLimit: BigInt(options.gasLimit ?? DEFAULT_GAS_LIMIT),
      payer: '',
      granter: '',
    })

    const authInfo = create(AuthInfoSchema, {
      signerInfos: [signerInfo],
      fee,
      tip: undefined,
    })

    return toBinary(AuthInfoSchema, authInfo)
  }

  /**
   * Sign a transaction.
   * Supports direct, amino, and eip191 signing modes.
   *
   * @param bodyBytes - Serialized TxBody
   * @param authInfoBytes - Serialized AuthInfo
   * @param signOptions - Sign options
   * @param options - Transaction options (needed for amino msgs and fee)
   * @returns Signature bytes
   * @throws Error if no key is set
   */
  async sign(
    bodyBytes: Uint8Array,
    authInfoBytes: Uint8Array,
    signOptions: WalletSignOptions,
    options?: CreateTxOptions
  ): Promise<Uint8Array> {
    const key = this.requireKey()
    const signMode = options?.signMode ?? 'direct'

    switch (signMode) {
      case 'amino':
      case 'eip191': {
        if (!options) throw new Error('CreateTxOptions required for amino/eip191 signing')
        const aminoMsgs = options.msgs.map(m => normalizeMsg(m).toAmino())
        const stdFee: StdFee = {
          amount: options.fee ?? [],
          gas: (options.gasLimit ?? DEFAULT_GAS_LIMIT).toString(),
        }
        const stdSignDoc = makeStdSignDoc(
          aminoMsgs,
          stdFee,
          signOptions.chainId,
          options.memo ?? '',
          signOptions.accountNumber,
          signOptions.sequence
        )
        return signMode === 'eip191' ? signEIP191(key, stdSignDoc) : signAmino(key, stdSignDoc)
      }
      case 'direct':
      default: {
        const signBytes = makeSignBytes(
          bodyBytes,
          authInfoBytes,
          signOptions.chainId,
          signOptions.accountNumber
        )
        return signDirect(key, signBytes)
      }
    }
  }

  /**
   * Create and sign a transaction.
   * Supports all signing modes (direct, amino, eip191).
   *
   * @param options - Transaction options
   * @param signOptions - Sign options
   * @returns Signed transaction
   * @throws Error if no key is set
   */
  async createAndSignTx(
    options: CreateTxOptions,
    signOptions: WalletSignOptions
  ): Promise<SignedTx> {
    const bodyBytes = this.createTxBody(options)
    const authInfoBytes = this.createAuthInfo(options, signOptions)

    const signature = await this.sign(bodyBytes, authInfoBytes, signOptions, options)

    const txRaw = create(TxRawSchema, {
      bodyBytes,
      authInfoBytes,
      signatures: [signature],
    })

    const txBytes = toBinary(TxRawSchema, txRaw)

    return {
      txBytes,
      bodyBytes,
      authInfoBytes,
      signature,
    }
  }

  // ============= Bridge =============

  private _bridge?: WalletBridge

  /**
   * OPInit bridge accessor for L1 ↔ L2 operations.
   *
   * Provides deposit, withdraw, claim, and withdrawal status tracking
   * with automatic sender derivation and signing.
   *
   * Requires provider to be set.
   *
   * @example
   * ```typescript
   * const wallet = createWallet({ key, provider })
   *
   * // Deposit to L2
   * await wallet.bridge.deposit('minimove-1', '1000000uinit')
   *
   * // Check withdrawals
   * const withdrawals = await wallet.bridge.getWithdrawals('minimove-1')
   * ```
   */
  get bridge(): WalletBridge {
    if (!this.provider) {
      throw new Error('Provider is required for bridge operations')
    }
    if (!this._bridge) {
      this._bridge = new WalletBridge(
        chainId => this.chain(chainId),
        chainId => this.getAddress(chainId),
        this.provider
      )
    }
    return this._bridge
  }

  /**
   * Get a ChainContext for a specific chain.
   * Requires provider to be set.
   *
   * @param chainId - Chain ID to get context for
   * @param options - ChainContext options (auth, headers, signer override, etc.)
   * @returns ChainContext for the specified chain
   * @throws ChainNotFoundError if chain not found in provider
   * @throws Error if provider is not set
   *
   * @example With wallet's key
   * ```typescript
   * const wallet = createWallet({ key, provider })
   * const ctx = wallet.chain('initiation-2')
   * await ctx.signAndBroadcast([msg])
   * ```
   *
   * @example With auth headers
   * ```typescript
   * const ctx = wallet.chain('initiation-2', { auth: auth.bearer('token') })
   * ```
   *
   * @example With one-time signer override
   * ```typescript
   * const ctx = wallet.chain('initiation-2', { signer: differentKey })
   * ```
   *
   * @example Watch-only (address but no signer)
   * ```typescript
   * const ctx = wallet.chain('initiation-2', { address: 'init1...' })
   * const balance = await ctx.getBalance()  // uses tracked address
   * ```
   */
  chain<T extends ChainType = ChainType>(
    chainId: string,
    options?: ChainContextOptions
  ): ChainContext<T> {
    if (!this.provider) {
      throw new Error('Provider is required to get chain context')
    }

    const chainInfo = this.provider.getChainInfo(chainId)
    if (!chainInfo) {
      throw new ChainNotFoundError(chainId)
    }

    // Use provided signer, or fall back to wallet's key
    const signer = options?.signer ?? this.key

    return this._createChainContext(chainInfo, { ...options, signer }) as ChainContext<T>
  }
}
