import { describe, it, expect } from 'vitest'
import { createServiceRegistry } from '../../../src/client/service-registry'

import { file_cosmos_crypto_ed25519_keys } from '@initia/initia-proto/cosmos/crypto/ed25519/keys_pb'
import { file_cosmos_crypto_secp256k1_keys } from '@initia/initia-proto/cosmos/crypto/secp256k1/keys_pb'

describe('ServiceRegistryBuilder type registry', () => {
  it('getRegistry() returns empty registry when no types added', () => {
    const builder = createServiceRegistry()
    const registry = builder.getRegistry()
    expect(registry).toBeDefined()
    expect(registry.getMessage('cosmos.crypto.ed25519.PubKey')).toBeUndefined()
  })

  it('addTypes() with DescFile registers all types in that file', () => {
    const builder = createServiceRegistry().addTypes(file_cosmos_crypto_ed25519_keys)
    const registry = builder.getRegistry()
    expect(registry.getMessage('cosmos.crypto.ed25519.PubKey')).toBeDefined()
    expect(registry.getMessage('cosmos.crypto.ed25519.PrivKey')).toBeDefined()
  })

  it('addTypes() chains with add()', () => {
    const builder = createServiceRegistry()
      .addTypes(file_cosmos_crypto_ed25519_keys)
      .addTypes(file_cosmos_crypto_secp256k1_keys)
    const registry = builder.getRegistry()
    expect(registry.getMessage('cosmos.crypto.ed25519.PubKey')).toBeDefined()
    expect(registry.getMessage('cosmos.crypto.secp256k1.PubKey')).toBeDefined()
  })

  it('getRegistry() caches the created registry', () => {
    const builder = createServiceRegistry().addTypes(file_cosmos_crypto_ed25519_keys)
    const r1 = builder.getRegistry()
    const r2 = builder.getRegistry()
    expect(r1).toBe(r2)
  })

  it('addTypes() invalidates cached registry', () => {
    const builder = createServiceRegistry().addTypes(file_cosmos_crypto_ed25519_keys)
    const r1 = builder.getRegistry()
    builder.addTypes(file_cosmos_crypto_secp256k1_keys)
    const r2 = builder.getRegistry()
    expect(r1).not.toBe(r2)
    expect(r2.getMessage('cosmos.crypto.secp256k1.PubKey')).toBeDefined()
  })
})
