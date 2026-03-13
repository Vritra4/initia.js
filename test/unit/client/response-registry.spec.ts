import { describe, it, expect } from 'vitest'
import { create, createRegistry } from '@bufbuild/protobuf'
import { wrapResponse } from '../../../src/client/response'
import { InitiaServices } from '../../../src/client/services/initia'
import { MinievmServices } from '../../../src/client/services/minievm'
import { MinimoveServices } from '../../../src/client/services/minimove'
import { MiniwasmServices } from '../../../src/client/services/miniwasm'
import { OtherServices } from '../../../src/client/services/other'

import { QueryAccountResponseSchema } from '@initia/initia-proto/cosmos/auth/v1beta1/query_pb'
import {
  BaseAccountSchema,
  file_cosmos_auth_v1beta1_auth,
} from '@initia/initia-proto/cosmos/auth/v1beta1/auth_pb'
import { anyPack } from '@bufbuild/protobuf/wkt'

describe('wrapResponse with Registry for Any fields', () => {
  function createAccountResponse() {
    const baseAccount = create(BaseAccountSchema, {
      address: 'init1test',
      accountNumber: 1n,
      sequence: 0n,
    })
    return create(QueryAccountResponseSchema, {
      account: anyPack(BaseAccountSchema, baseAccount),
    })
  }

  it('toJson() succeeds when registry is provided for Any field', () => {
    const response = createAccountResponse()
    const registry = createRegistry(file_cosmos_auth_v1beta1_auth)
    const wrapped = wrapResponse(QueryAccountResponseSchema, response, registry)
    const json = wrapped.toJson()
    expect(json).toBeDefined()
    expect((json as Record<string, unknown>).account).toBeDefined()
  })

  it('toJson() without registry throws on Any field', () => {
    const response = createAccountResponse()
    const wrapped = wrapResponse(QueryAccountResponseSchema, response)
    expect(() => wrapped.toJson()).toThrow()
  })

  it('toJson() allows user options to provide registry when no built-in', () => {
    const response = createAccountResponse()
    const wrapped = wrapResponse(QueryAccountResponseSchema, response)
    const registry = createRegistry(file_cosmos_auth_v1beta1_auth)
    const json = wrapped.toJson({ registry })
    expect(json).toBeDefined()
  })

  it('user-provided registry takes precedence over built-in registry', () => {
    const response = createAccountResponse()

    // Wrap with empty built-in registry (would fail if used for Any)
    const emptyRegistry = createRegistry()
    const wrapped = wrapResponse(QueryAccountResponseSchema, response, emptyRegistry)

    // User provides a complete registry — should take precedence and succeed
    const userRegistry = createRegistry(file_cosmos_auth_v1beta1_auth)
    const json = wrapped.toJson({ registry: userRegistry })
    expect(json).toBeDefined()
    expect((json as Record<string, unknown>).account).toBeDefined()
  })

  it('nested Any-wrapped field inherits registry from parent', () => {
    const response = createAccountResponse()
    const registry = createRegistry(file_cosmos_auth_v1beta1_auth)
    const wrapped = wrapResponse(QueryAccountResponseSchema, response, registry)

    // Access nested Any field — should also be wrapped with registry
    const nestedAccount = wrapped.account
    expect(nestedAccount).toBeDefined()
    const nestedJson = nestedAccount!.toJson()
    expect(nestedJson).toBeDefined()
  })
})

describe('Chain preset registries', () => {
  it('InitiaServices.getRegistry() resolves all expected types', () => {
    const registry = InitiaServices.getRegistry()
    // Common types (inherited)
    expect(registry.getMessage('cosmos.crypto.ed25519.PubKey')).toBeDefined()
    expect(registry.getMessage('cosmos.crypto.secp256k1.PubKey')).toBeDefined()
    expect(registry.getMessage('cosmos.auth.v1beta1.BaseAccount')).toBeDefined()
    // Initia-specific types
    expect(registry.getMessage('initia.crypto.v1beta1.ethsecp256k1.PubKey')).toBeDefined()
    expect(registry.getMessage('initia.move.v1.ObjectAccount')).toBeDefined()
    expect(registry.getMessage('initia.move.v1.TableAccount')).toBeDefined()
  })

  it('MinievmServices.getRegistry() resolves EVM account types', () => {
    const registry = MinievmServices.getRegistry()
    expect(registry.getMessage('cosmos.crypto.ed25519.PubKey')).toBeDefined()
    expect(registry.getMessage('minievm.evm.v1.ContractAccount')).toBeDefined()
    expect(registry.getMessage('minievm.evm.v1.ShorthandAccount')).toBeDefined()
  })

  it('MinimoveServices.getRegistry() resolves Move account types', () => {
    const registry = MinimoveServices.getRegistry()
    expect(registry.getMessage('cosmos.crypto.ed25519.PubKey')).toBeDefined()
    expect(registry.getMessage('initia.move.v1.ObjectAccount')).toBeDefined()
    expect(registry.getMessage('initia.move.v1.TableAccount')).toBeDefined()
  })

  it('MiniwasmServices.getRegistry() resolves common types', () => {
    const registry = MiniwasmServices.getRegistry()
    expect(registry.getMessage('cosmos.crypto.ed25519.PubKey')).toBeDefined()
    expect(registry.getMessage('cosmos.crypto.secp256k1.PubKey')).toBeDefined()
    expect(registry.getMessage('cosmos.auth.v1beta1.BaseAccount')).toBeDefined()
  })

  it('OtherServices.getRegistry() resolves common types', () => {
    const registry = OtherServices.getRegistry()
    expect(registry.getMessage('cosmos.crypto.ed25519.PubKey')).toBeDefined()
    expect(registry.getMessage('cosmos.crypto.secp256k1.PubKey')).toBeDefined()
    expect(registry.getMessage('cosmos.auth.v1beta1.BaseAccount')).toBeDefined()
  })
})
