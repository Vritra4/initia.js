import { describe, it, expect } from 'vitest'
import { generateMoveAbiString } from '../../../src/codegen/move'

// Minimal valid Move module ABI JSON (coin module)
const VALID_ABI_JSON = JSON.stringify({
  address: '0x1',
  name: 'coin',
  friends: [],
  exposed_functions: [
    {
      name: 'balance',
      visibility: 'public',
      is_entry: false,
      is_view: true,
      generic_type_params: [{ constraints: [] }],
      params: ['address'],
      return: ['u64'],
    },
    {
      name: 'transfer',
      visibility: 'public',
      is_entry: true,
      is_view: false,
      generic_type_params: [{ constraints: [] }],
      params: ['&signer', 'address', 'u64'],
      return: [],
    },
  ],
  structs: [
    {
      name: 'CoinStore',
      is_native: false,
      abilities: ['key'],
      generic_type_params: [{ constraints: [] }],
      fields: [
        { name: 'coin', type: '0x1::coin::Coin<T0>' },
        { name: 'frozen', type: 'bool' },
      ],
    },
  ],
})

describe('generateMoveAbiString', () => {
  it('should generate valid TypeScript with import, export, and type assertion', () => {
    const result = generateMoveAbiString(VALID_ABI_JSON)

    // Header comment
    expect(result).toContain('// Move module: 0x1::coin')
    expect(result).toContain('// This file is auto-generated. Do not edit manually.')

    // Import statement
    expect(result).toContain("import type { ReadonlyMoveModuleAbi } from 'initia.js/move'")

    // Export with derived name (coin -> COIN_ABI)
    expect(result).toContain('export const COIN_ABI =')

    // Type assertion
    expect(result).toContain('as const satisfies ReadonlyMoveModuleAbi')

    // Contains function names from the ABI
    expect(result).toContain("'balance'")
    expect(result).toContain("'transfer'")

    // Contains struct name
    expect(result).toContain("'CoinStore'")

    // Uses single quotes (from formatObjectLiteral)
    expect(result).toContain("'0x1'")
    expect(result).toContain("'coin'")
  })

  it('should use custom export name when provided', () => {
    const result = generateMoveAbiString(VALID_ABI_JSON, { exportName: 'MY_COIN' })

    expect(result).toContain('export const MY_COIN =')
    // Should not contain the derived name
    expect(result).not.toContain('COIN_ABI')
  })

  it('should derive UPPER_SNAKE_CASE export name from module name', () => {
    const abiWithCamelCase = JSON.stringify({
      address: '0x1',
      name: 'fungibleAsset',
      friends: [],
      exposed_functions: [],
      structs: [],
    })

    const result = generateMoveAbiString(abiWithCamelCase)
    expect(result).toContain('export const FUNGIBLE_ASSET_ABI =')
  })

  it('should throw on invalid JSON', () => {
    expect(() => generateMoveAbiString('not valid json')).toThrow()
  })

  it('should throw when address is missing', () => {
    const noAddress = JSON.stringify({
      name: 'coin',
      friends: [],
      exposed_functions: [],
      structs: [],
    })
    expect(() => generateMoveAbiString(noAddress)).toThrow()
  })

  it('should throw when name is missing', () => {
    const noName = JSON.stringify({
      address: '0x1',
      friends: [],
      exposed_functions: [],
      structs: [],
    })
    expect(() => generateMoveAbiString(noName)).toThrow()
  })

  it('should handle modules with empty functions and structs', () => {
    const emptyModule = JSON.stringify({
      address: '0x1',
      name: 'empty',
      friends: [],
      exposed_functions: [],
      structs: [],
    })

    const result = generateMoveAbiString(emptyModule)
    expect(result).toContain('export const EMPTY_ABI =')
    expect(result).toContain("'empty'")
    expect(result).toContain('exposed_functions: []')
    expect(result).toContain('structs: []')
  })

  it('should preserve all ABI fields in output', () => {
    const result = generateMoveAbiString(VALID_ABI_JSON)

    // Verify key structural fields are present
    expect(result).toContain('exposed_functions:')
    expect(result).toContain('visibility:')
    expect(result).toContain('is_entry:')
    expect(result).toContain('is_view:')
    expect(result).toContain('generic_type_params:')
    expect(result).toContain('params:')
    expect(result).toContain('return:')
    expect(result).toContain('structs:')
    expect(result).toContain('abilities:')
    expect(result).toContain('fields:')
  })
})
