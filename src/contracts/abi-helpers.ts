import type { Abi } from 'abitype'
import type { ReadonlyMoveModuleAbi } from './move/types'
import type { ReadonlyWasmContractSchema } from './wasm/types'

/**
 * EVM ABI helper — preserves literal types without `as const satisfies Abi`.
 *
 * @example
 * ```typescript
 * const ERC20 = evmAbi([
 *   { type: 'function', name: 'balanceOf', inputs: [], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
 * ])
 * ```
 */
export function evmAbi<const T extends Abi>(abi: T): T {
  return abi
}

/**
 * Move ABI helper — preserves literal types without `as const satisfies ReadonlyMoveModuleAbi`.
 *
 * @example
 * ```typescript
 * const COIN = moveAbi({
 *   address: '0x1', name: 'coin',
 *   friends: [], exposed_functions: [], structs: [],
 * })
 * ```
 */
export function moveAbi<const T extends ReadonlyMoveModuleAbi>(abi: T): T {
  return abi
}

/**
 * Wasm schema helper — preserves literal types without `as const satisfies ReadonlyWasmContractSchema`.
 * Eliminates the need for nested `as const` on `required` arrays.
 *
 * @example
 * ```typescript
 * const CW20 = wasmAbi({
 *   execute: { oneOf: [{ required: ['transfer'], properties: { transfer: {} } }] },
 *   query: { oneOf: [{ required: ['balance'], properties: { balance: {} } }] },
 * })
 * ```
 */
export function wasmAbi<const T extends ReadonlyWasmContractSchema>(schema: T): T {
  return schema
}

/**
 * Unified ABI helper — TypeScript overload resolution selects the correct type
 * constraint: EVM for arrays, Move for objects with `address`/`name`, Wasm for
 * objects with `execute`/`query`. No runtime detection; this is compile-time only.
 *
 * For ambiguous shapes (e.g. an object with both `address`/`name` and `execute`/`query`),
 * prefer the explicit variants: `evmAbi()`, `moveAbi()`, `wasmAbi()`.
 *
 * @example
 * ```typescript
 * const erc20 = abi([{ type: 'function', name: 'balanceOf', inputs: [], outputs: [], stateMutability: 'view' }])
 * const coin  = abi({ address: '0x1', name: 'coin', friends: [], exposed_functions: [], structs: [] })
 * const cw20  = abi({ execute: { oneOf: [{ required: ['transfer'], properties: { transfer: {} } }] } })
 * ```
 */
export function abi<const T extends Abi>(abi: T): T
export function abi<const T extends ReadonlyMoveModuleAbi>(abi: T): T
export function abi<const T extends ReadonlyWasmContractSchema>(schema: T): T
export function abi(input: unknown): unknown {
  return input
}
