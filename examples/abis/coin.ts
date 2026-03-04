/**
 * Static Move coin module ABI for typed contract interactions.
 *
 * Dumped from chain: `await getModuleAbi(ctx, '0x1', 'coin')`
 * Only commonly-used functions are included for brevity.
 *
 * Usage:
 *   import { COIN_ABI } from './abis/coin'
 *   const coin = createMoveContract(ctx, COIN_ABI)       // sync!
 *   coin.view.name({ args: [metadataAddr] })              // → Promise<string>
 *   coin.execute.transfer(sender, { typeArgs: [...], ... })
 */

import type { ReadonlyMoveModuleAbi } from 'initia.js/move'

export const COIN_ABI = {
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
      name: 'name',
      visibility: 'public',
      is_entry: false,
      is_view: true,
      generic_type_params: [],
      params: ['0x1::object::Object<0x1::fungible_asset::Metadata>'],
      return: ['0x1::string::String'],
    },
    {
      name: 'symbol',
      visibility: 'public',
      is_entry: false,
      is_view: true,
      generic_type_params: [],
      params: ['0x1::object::Object<0x1::fungible_asset::Metadata>'],
      return: ['0x1::string::String'],
    },
    {
      name: 'decimals',
      visibility: 'public',
      is_entry: false,
      is_view: true,
      generic_type_params: [],
      params: ['0x1::object::Object<0x1::fungible_asset::Metadata>'],
      return: ['u8'],
    },
    {
      name: 'is_frozen',
      visibility: 'public',
      is_entry: false,
      is_view: true,
      generic_type_params: [],
      params: ['0x1::object::Object<0x1::fungible_asset::Metadata>', 'address'],
      return: ['bool'],
    },
    {
      name: 'transfer',
      visibility: 'public',
      is_entry: true,
      is_view: false,
      generic_type_params: [{ constraints: [] }],
      params: ['&signer', 'address', '0x1::object::Object<0x1::fungible_asset::Metadata>', 'u64'],
      return: [],
    },
  ],
  structs: [],
} as const satisfies ReadonlyMoveModuleAbi
