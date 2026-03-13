#!/usr/bin/env node

/**
 * abigen CLI
 *
 * Generates TypeScript ABI files for Move, EVM, and CosmWasm contracts.
 * Thin wrapper over the codegen functions; no external CLI framework needed.
 *
 * Usage:
 *   abigen <command> [options]
 *
 * Commands:
 *   move   Fetch Move module ABI from chain via gRPC
 *   evm    Convert EVM ABI from JSON file or Etherscan-compatible explorer
 *   wasm   Convert CosmWasm schema from JSON files
 *
 * Run `abigen <command> --help` for command-specific options.
 */

import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { createGrpcTransport } from '@connectrpc/connect-node'
import { Query as MoveQuery } from '@initia/initia-proto/initia/move/v1/query_pb'

import { createGrpcClient } from '../client/grpc-client'
import { normalizeUrl } from '../client/transport-common'
import { generateMoveAbi } from './move'
import { generateEvmAbiFromJson, generateEvmAbiFromExplorer } from './evm'
import { generateWasmAbiFromJson } from './wasm'

// =============================================================================
// Arg parsing
// =============================================================================

interface ParsedArgs {
  command: string | undefined
  flags: Record<string, string>
  help: boolean
}

/**
 * Minimal key-value parser for `--key value` pairs.
 * Supports `--flag` (boolean) and `--key value` (string).
 */
function parseArgs(argv: string[]): ParsedArgs {
  const flags: Record<string, string> = {}
  let command: string | undefined
  let help = false

  let i = 0
  while (i < argv.length) {
    const arg = argv[i]

    if (arg === '--help' || arg === '-h') {
      help = true
      i++
      continue
    }

    if (arg.startsWith('--')) {
      const key = arg.slice(2)
      const next = argv[i + 1]

      // If next arg exists and is not a flag, treat it as the value
      if (next !== undefined && !next.startsWith('--')) {
        flags[key] = next
        i += 2
      } else {
        flags[key] = 'true'
        i++
      }
      continue
    }

    // First non-flag argument is the command
    if (command === undefined) {
      command = arg
    }
    i++
  }

  return { command, flags, help }
}

// =============================================================================
// Help text
// =============================================================================

const MAIN_HELP = `
abigen <command> [options]

Commands:
  move   Fetch Move module ABI from chain via gRPC
  evm    Convert EVM ABI from JSON file or Etherscan-compatible explorer
  wasm   Convert CosmWasm schema from JSON files

Common options:
  --out <path>     Output .ts file path (default: stdout)
  --name <name>    Export variable name
  --help           Show help
`.trim()

const MOVE_HELP = `
abigen move [options]

Fetch a Move module ABI from chain via gRPC and generate a TypeScript file.

Required:
  --address <addr>     Module address (e.g., 0x1)
  --module <name>      Module name (e.g., coin)
  --endpoint <url>     gRPC endpoint URL

Optional:
  --name <name>        Export variable name (default: derived from module name)
  --out <path>         Output .ts file path (default: stdout)
`.trim()

const EVM_HELP = `
abigen evm [options]

Convert an EVM ABI from a JSON file or Etherscan-compatible explorer.

From JSON file:
  --json <path>        Path to ABI JSON file (raw array or Hardhat/Foundry artifact)

From explorer:
  --address <addr>     Contract address
  --explorer <url>     Etherscan-compatible API base URL
  --api-key <key>      API key (optional)

Optional:
  --name <name>        Export variable name
  --out <path>         Output .ts file path (default: stdout)
`.trim()

const WASM_HELP = `
abigen wasm [options]

Convert CosmWasm JSON Schema files into a TypeScript file.

At least one of --execute or --query is required.

Options:
  --execute <path>     Path to execute_msg.json
  --query <path>       Path to query_msg.json

Optional:
  --name <name>        Export variable name (default: CONTRACT_SCHEMA)
  --out <path>         Output .ts file path (default: stdout)
`.trim()

// =============================================================================
// Command handlers
// =============================================================================

async function handleMove(flags: Record<string, string>): Promise<string> {
  const address = flags['address']
  const moduleName = flags['module']
  const endpoint = flags['endpoint']

  if (!address) throw new Error('Missing required option: --address')
  if (!moduleName) throw new Error('Missing required option: --module')
  if (!endpoint) throw new Error('Missing required option: --endpoint')

  // Create a minimal gRPC client with only the move service
  const transport = createGrpcTransport({
    baseUrl: normalizeUrl(endpoint),
  })

  const client = createGrpcClient(transport, { move: MoveQuery })

  return generateMoveAbi(
    { client },
    address,
    moduleName,
    flags['name'] ? { exportName: flags['name'] } : undefined
  )
}

async function handleEvm(flags: Record<string, string>): Promise<string> {
  const jsonPath = flags['json']
  const address = flags['address']
  const explorerUrl = flags['explorer']

  if (jsonPath) {
    // Read ABI from local JSON file
    const absolutePath = resolve(jsonPath)
    const content = await readFile(absolutePath, 'utf-8')
    const json: unknown = JSON.parse(content)

    return generateEvmAbiFromJson({
      json,
      exportName: flags['name'],
    })
  }

  if (address && explorerUrl) {
    return generateEvmAbiFromExplorer({
      address,
      explorerUrl,
      exportName: flags['name'],
      apiKey: flags['api-key'],
    })
  }

  throw new Error(
    'EVM command requires either --json <path> or both --address and --explorer. Run with --help for usage.'
  )
}

async function handleWasm(flags: Record<string, string>): Promise<string> {
  const executePath = flags['execute']
  const queryPath = flags['query']

  if (!executePath && !queryPath) {
    throw new Error(
      'Wasm command requires at least one of --execute or --query. Run with --help for usage.'
    )
  }

  let execute: unknown
  let query: unknown

  if (executePath) {
    const content = await readFile(resolve(executePath), 'utf-8')
    execute = JSON.parse(content)
  }

  if (queryPath) {
    const content = await readFile(resolve(queryPath), 'utf-8')
    query = JSON.parse(content)
  }

  return generateWasmAbiFromJson({
    execute,
    query,
    exportName: flags['name'],
  })
}

// =============================================================================
// Output
// =============================================================================

async function writeOutput(content: string, outPath: string | undefined): Promise<void> {
  if (outPath) {
    const absolutePath = resolve(outPath)
    await writeFile(absolutePath, content, 'utf-8')
    console.error(`Written to ${absolutePath}`)
  } else {
    process.stdout.write(content)
  }
}

// =============================================================================
// Main
// =============================================================================

function printHelp(text: string): void {
  process.stdout.write(text + '\n')
}

async function main(): Promise<void> {
  const { command, flags, help } = parseArgs(process.argv.slice(2))

  // No command or top-level --help
  if (!command || (help && !command)) {
    printHelp(MAIN_HELP)
    process.exit(0)
  }

  // Command-specific --help
  if (help) {
    switch (command) {
      case 'move':
        printHelp(MOVE_HELP)
        break
      case 'evm':
        printHelp(EVM_HELP)
        break
      case 'wasm':
        printHelp(WASM_HELP)
        break
      default:
        printHelp(MAIN_HELP)
    }
    process.exit(0)
  }

  let result: string

  switch (command) {
    case 'move':
      result = await handleMove(flags)
      break
    case 'evm':
      result = await handleEvm(flags)
      break
    case 'wasm':
      result = await handleWasm(flags)
      break
    default:
      console.error(`Unknown command: ${command}`)
      console.error(MAIN_HELP)
      process.exit(1)
  }

  await writeOutput(result, flags['out'])
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`Error: ${message}`)
  process.exit(1)
})
