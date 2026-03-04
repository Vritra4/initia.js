import { describe, it, expect } from 'vitest'
import { generateMoveAbiString } from '../../../src/codegen/move'
import { generateEvmAbiFromJson } from '../../../src/codegen/evm'
import { generateWasmAbiFromJson } from '../../../src/codegen/wasm'

describe('codegen integration', () => {
  it('Move output contains all required parts', () => {
    const abiJson = JSON.stringify({
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
      ],
      structs: [],
    })

    const output = generateMoveAbiString(abiJson)

    expect(output).toMatch(/^\/\/ Move module: 0x1::coin/)
    expect(output).toContain('import type { ReadonlyMoveModuleAbi }')
    expect(output).toContain('export const COIN_ABI =')
    expect(output).toContain("address: '0x1'")
    expect(output).toContain("name: 'coin'")
    expect(output).toContain('as const satisfies ReadonlyMoveModuleAbi')
  })

  it('EVM output handles Hardhat artifact', () => {
    const artifact = {
      contractName: 'MyToken',
      abi: [
        {
          type: 'function',
          name: 'name',
          stateMutability: 'view',
          inputs: [],
          outputs: [{ type: 'string' }],
        },
      ],
    }

    const output = generateEvmAbiFromJson({ json: artifact })

    expect(output).toContain('import type { Abi }')
    expect(output).toContain('export const MY_TOKEN_ABI =')
    expect(output).toContain("'name'")
  })

  it('Wasm output preserves oneOf and anyOf', () => {
    const execute = {
      oneOf: [{ required: ['transfer'], properties: { transfer: {} } }],
    }
    const query = {
      anyOf: [{ required: ['balance'], properties: { balance: {} } }],
    }

    const output = generateWasmAbiFromJson({ execute, query, exportName: 'MY_SCHEMA' })

    expect(output).toContain('import type { ReadonlyWasmContractSchema }')
    expect(output).toContain('export const MY_SCHEMA =')
    expect(output).toContain('oneOf')
    expect(output).toContain('anyOf')
    expect(output).toContain("'transfer'")
    expect(output).toContain("'balance'")
  })
})
