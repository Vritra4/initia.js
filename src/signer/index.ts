/**
 * Signer module exports for external key management.
 */

export {
  type SigningAlgorithm,
  type Signer,
  type DirectSignDoc,
  type DirectSignResponse,
  type DirectSigner,
  type AminoFee,
  type AminoMsg,
  type AminoSignDoc,
  type AminoSignResponse,
  type AminoSigner,
  type OfflineSigner,
  type EIP191Signer,
  isDirectSigner,
  isAminoSigner,
  isOfflineSigner,
  isEIP191Signer,
} from './types'

export {
  type KeyInfo,
  type AddKeyOptions,
  type ImportMnemonicOptions,
  type KeyStore,
  canAddKeys,
  canDeleteKeys,
  canImportMnemonic,
  BaseKeyStore,
} from './keystore'

// Bridge adapters (SDK ↔ viem/ethers)
export { keyToViemAccount, viemAccountToSigner } from './bridges/viem'
export { ethersWalletToSigner, type EthersWalletLike } from './bridges/ethers'
