import { describe, it, expect } from 'vitest'
import {
  type Signer,
  type DirectSigner,
  type AminoSigner,
  type OfflineSigner,
  isDirectSigner,
  isAminoSigner,
  isOfflineSigner,
  isEIP191Signer,
} from '../../src/signer/types'
import { MnemonicKey } from '../../src/key'

describe('Signer Types', () => {
  // Mock implementations for testing type guards
  const createBasicSigner = (): Signer => ({
    algorithm: 'eth_secp256k1', // Initia default
    getPublicKey: async () => new Uint8Array(33),
    getAddress: async () => 'init1...',
    sign: async () => new Uint8Array(64),
  })

  const createDirectSigner = (): DirectSigner => ({
    ...createBasicSigner(),
    signDirect: async () => ({
      signed: {
        bodyBytes: new Uint8Array(),
        authInfoBytes: new Uint8Array(),
        chainId: 'initiation-2',
        accountNumber: 0n,
      },
      signature: {
        pubKey: { typeUrl: '/cosmos.crypto.secp256k1.PubKey', value: new Uint8Array(33) },
        signature: new Uint8Array(64),
      },
    }),
  })

  const createAminoSigner = (): AminoSigner => ({
    ...createBasicSigner(),
    signAmino: async () => ({
      signed: {
        chain_id: 'initiation-2',
        account_number: '0',
        sequence: '0',
        fee: { amount: [], gas: '200000' },
        msgs: [],
        memo: '',
      },
      signature: {
        pub_key: { type: 'tendermint/PubKeySecp256k1', value: 'base64...' },
        signature: 'base64...',
      },
    }),
  })

  const createOfflineSigner = (): OfflineSigner => ({
    ...createDirectSigner(),
    signAmino: createAminoSigner().signAmino,
  })

  describe('isDirectSigner', () => {
    it('should return true for DirectSigner', () => {
      const signer = createDirectSigner()
      expect(isDirectSigner(signer)).toBe(true)
    })

    it('should return false for basic Signer', () => {
      const signer = createBasicSigner()
      expect(isDirectSigner(signer)).toBe(false)
    })

    it('should return true for OfflineSigner', () => {
      const signer = createOfflineSigner()
      expect(isDirectSigner(signer)).toBe(true)
    })
  })

  describe('isAminoSigner', () => {
    it('should return true for AminoSigner', () => {
      const signer = createAminoSigner()
      expect(isAminoSigner(signer)).toBe(true)
    })

    it('should return false for basic Signer', () => {
      const signer = createBasicSigner()
      expect(isAminoSigner(signer)).toBe(false)
    })

    it('should return true for OfflineSigner', () => {
      const signer = createOfflineSigner()
      expect(isAminoSigner(signer)).toBe(true)
    })
  })

  describe('isOfflineSigner', () => {
    it('should return true for OfflineSigner', () => {
      const signer = createOfflineSigner()
      expect(isOfflineSigner(signer)).toBe(true)
    })

    it('should return false for DirectSigner only', () => {
      const signer = createDirectSigner()
      expect(isOfflineSigner(signer)).toBe(false)
    })

    it('should return false for AminoSigner only', () => {
      const signer = createAminoSigner()
      expect(isOfflineSigner(signer)).toBe(false)
    })

    it('should return false for basic Signer', () => {
      const signer = createBasicSigner()
      expect(isOfflineSigner(signer)).toBe(false)
    })
  })

  describe('isEIP191Signer', () => {
    it('should return true for Key (has signPersonal)', () => {
      const key = new MnemonicKey({
        mnemonic:
          'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art',
      })
      expect(isEIP191Signer(key)).toBe(true)
    })

    it('should return false for DirectSigner-only mock', () => {
      const signer = createDirectSigner()
      expect(isEIP191Signer(signer)).toBe(false)
    })

    it('should return true for plain object with signPersonal', () => {
      const obj = { signPersonal: async () => new Uint8Array() }
      expect(isEIP191Signer(obj)).toBe(true)
    })

    it('should return false for undefined and null', () => {
      expect(isEIP191Signer(undefined)).toBe(false)
      expect(isEIP191Signer(null)).toBe(false)
    })
  })

  describe('Signer interface', () => {
    it('should have correct structure', async () => {
      const signer = createBasicSigner()

      expect(signer.algorithm).toBe('eth_secp256k1')
      expect(typeof signer.getPublicKey).toBe('function')
      expect(typeof signer.getAddress).toBe('function')
      expect(typeof signer.sign).toBe('function')

      const pubKey = await signer.getPublicKey()
      expect(pubKey).toBeInstanceOf(Uint8Array)

      const address = await signer.getAddress()
      expect(typeof address).toBe('string')

      const signature = await signer.sign(new Uint8Array([1, 2, 3]))
      expect(signature).toBeInstanceOf(Uint8Array)
    })
  })

  describe('DirectSigner interface', () => {
    it('should have signDirect method', async () => {
      const signer = createDirectSigner()

      expect(typeof signer.signDirect).toBe('function')

      const response = await signer.signDirect('init1...', {
        bodyBytes: new Uint8Array(),
        authInfoBytes: new Uint8Array(),
        chainId: 'initiation-2',
        accountNumber: 12345n,
      })

      expect(response.signed).toBeDefined()
      expect(response.signed.chainId).toBe('initiation-2')
      expect(response.signature).toBeDefined()
      expect(response.signature.pubKey).toBeDefined()
      expect(response.signature.signature).toBeInstanceOf(Uint8Array)
    })
  })

  describe('AminoSigner interface', () => {
    it('should have signAmino method', async () => {
      const signer = createAminoSigner()

      expect(typeof signer.signAmino).toBe('function')

      const response = await signer.signAmino('init1...', {
        chain_id: 'initiation-2',
        account_number: '12345',
        sequence: '0',
        fee: { amount: [{ denom: 'uinit', amount: '1000' }], gas: '200000' },
        msgs: [],
        memo: '',
      })

      expect(response.signed).toBeDefined()
      expect(response.signed.chain_id).toBe('initiation-2')
      expect(response.signature).toBeDefined()
      expect(response.signature.pub_key).toBeDefined()
      expect(typeof response.signature.signature).toBe('string')
    })
  })
})
