/**
 * Message builder type definitions.
 *
 * Each chain type has its own message interface with chain-specific methods.
 *
 * ## Supported Messages
 *
 * This SDK provides builders for commonly used messages:
 *
 * | Module       | Messages                                    | Use Case           |
 * |--------------|---------------------------------------------|--------------------|
 * | bank         | send                                        | Token transfers    |
 * | staking      | delegate, undelegate, redelegate            | Staking operations |
 * | distribution | withdrawRewards                             | Claim rewards      |
 * | gov          | vote, deposit                               | Governance         |
 * | ibc          | transfer                                    | Cross-chain        |
 * | authz        | grant, exec, revoke                         | Authorization      |
 * | feegrant     | grantAllowance, revokeAllowance             | Fee delegation     |
 * | group        | createGroup, vote                           | Group governance   |
 * | move         | execute, script                             | Move contracts     |
 * | wasm         | instantiate, executeContract, migrate       | CosmWasm contracts |
 * | evm          | call, create                                | EVM contracts      |
 *
 * ## Unsupported Messages
 *
 * Some Cosmos SDK messages are intentionally not included because they are
 * rarely used by typical SDK consumers:
 *
 * | Module   | Messages         | Reason                                    |
 * |----------|------------------|-------------------------------------------|
 * | slashing | MsgUnjail        | Validator operators only                  |
 * | evidence | MsgSubmitEvidence| Very rare, security-critical              |
 * | upgrade  | MsgSoftwareUpgrade| Governance proposals only                |
 * | crisis   | MsgVerifyInvariant| Emergency use only                       |
 * | params   | MsgUpdateParams  | Governance proposals only                 |
 *
 * ## Using Custom Messages
 *
 * For any message not directly supported, use `msgs.custom()`:
 *
 * @example
 * ```typescript
 * import { MsgUnjailSchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/slashing/v1beta1/tx_pb'
 *
 * // Create any Cosmos SDK message
 * const unjailMsg = msgs.custom(MsgUnjailSchema, {
 *   validatorAddr: 'initvaloper1...'
 * })
 *
 * // Use it like any other message
 * await ctx.signAndBroadcast([unjailMsg])
 * ```
 *
 * This approach provides:
 * - Full type safety from BSR protobuf schemas
 * - Automatic Any packing
 * - Compatibility with all SDK features (signing, broadcasting, etc.)
 */

import type { Numeric } from '../types'
import type { DescMessage, MessageInitShape, MessageShape } from '@bufbuild/protobuf'
import { type Any, anyUnpack } from '@bufbuild/protobuf/wkt'
import type { MsgSendSchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/bank/v1beta1/tx_pb'
import type { MsgTransferSchema } from '@buf/cosmos_ibc.bufbuild_es/ibc/applications/transfer/v1/tx_pb'
import type {
  MsgDelegateSchema,
  MsgUndelegateSchema,
  MsgBeginRedelegateSchema,
} from '@buf/initia-labs_initia.bufbuild_es/initia/mstaking/v1/tx_pb'
import type { MsgWithdrawDelegatorRewardSchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/distribution/v1beta1/tx_pb'
import type {
  MsgExecuteSchema,
  MsgScriptSchema,
} from '@buf/initia-labs_initia.bufbuild_es/initia/move/v1/tx_pb'
import type {
  MsgVoteSchema,
  MsgDepositSchema,
} from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/gov/v1/tx_pb'
import type {
  MsgGrantSchema,
  MsgExecSchema,
  MsgRevokeSchema,
} from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/authz/v1beta1/tx_pb'
import type {
  MsgGrantAllowanceSchema,
  MsgRevokeAllowanceSchema,
} from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/feegrant/v1beta1/tx_pb'
import type {
  MsgCreateGroupSchema,
  MsgVoteSchema as MsgGroupVoteSchema,
} from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/group/v1/tx_pb'
import type {
  MsgStoreCodeSchema,
  MsgInstantiateContractSchema,
  MsgExecuteContractSchema,
  MsgMigrateContractSchema,
} from '@buf/cosmwasm_wasmd.bufbuild_es/cosmwasm/wasm/v1/tx_pb'
import type {
  MsgCallSchema,
  MsgCreateSchema,
} from '@buf/initia-labs_minievm.bufbuild_es/minievm/evm/v1/tx_pb'
import { create, toJson as msgToJson } from '@bufbuild/protobuf'
import { anyPack } from '../util/any'
import { toAmino as protoToAmino, type AminoMsg } from '../tx/amino'
import { InitiaError } from '../errors'
import type { Coin } from '../core/coin'
import type { ChainType } from '../client/types'

/**
 * Human-readable JSON representation of a message.
 */
export interface JsonMsg {
  typeUrl: string
  value: Record<string, unknown>
}

/**
 * Transaction message with schema and value.
 *
 * Holds the protobuf schema alongside the message value, enabling
 * conversion to both proto Any (for direct signing) and Amino format
 * (for amino/eip191 signing) from a single source.
 *
 * @example
 * ```typescript
 * // High-level (via msg builders — no schema knowledge needed)
 * const msg = msgs.send(from, to, amount)
 *
 * // Mid-level (custom messages)
 * const msg = new Message(MsgUnjailSchema, { validatorAddr: '...' })
 *
 * // Low-level (custom amino conversion)
 * const msg = new Message(CustomSchema, data, {
 *   toAmino: (v) => ({ type: 'custom/Msg', value: { field: v.someField } })
 * })
 * ```
 */
export class Message<T extends DescMessage = DescMessage> {
  readonly schema: T
  readonly value: MessageShape<T>
  private _rawAny?: Any
  private _aminoOverride?: (value: MessageShape<T>) => AminoMsg

  constructor(
    schema: T,
    init: MessageInitShape<T>,
    options?: { toAmino?: (value: MessageShape<T>) => AminoMsg }
  ) {
    this.schema = schema
    this.value = create(schema, init)
    if (options?.toAmino) this._aminoOverride = options.toAmino
  }

  /** Convert to Amino format for amino/eip191 signing. */
  toAmino(): AminoMsg {
    if (this._rawAny) {
      throw new InitiaError(
        'Cannot convert pre-packed Any to Amino format. ' +
          'Provide a schema via new Message(schema, init) for amino signing support.'
      )
    }
    if (this._aminoOverride) return this._aminoOverride(this.value)
    return protoToAmino(this.schema, this.value)
  }

  /**
   * Convert to human-readable JSON.
   *
   * @example
   * ```typescript
   * const msg = msgs.send('init1from...', 'init1to...', coin('uinit', '1000000'))
   * msg.toJson()
   * // → { typeUrl: "/cosmos.bank.v1beta1.MsgSend",
   * //     value: { fromAddress: "init1from...", toAddress: "init1to...", amount: [...] } }
   * ```
   */
  toJson(): JsonMsg {
    if (this._rawAny) {
      throw new InitiaError(
        'Cannot convert pre-packed Any to JSON. ' +
          'Provide a schema via new Message(schema, init) for JSON support.'
      )
    }
    return {
      typeUrl: '/' + this.schema.typeName,
      value: msgToJson(this.schema, this.value) as Record<string, unknown>,
    }
  }

  /** Pack as protobuf Any for direct signing / TxBody. */
  toAny(): Any {
    if (this._rawAny) return this._rawAny
    return anyPack(this.schema, this.value)
  }

  /** Type URL for this message (e.g., '/cosmos.bank.v1beta1.MsgSend'). */
  get typeUrl(): string {
    if (this._rawAny) return this._rawAny.typeUrl
    return '/' + this.schema.typeName
  }

  /**
   * Wrap a pre-packed Any as a DIRECT-only Message.
   * toAny() returns the original Any; toAmino() throws.
   *
   * Used for opaque messages from external systems (e.g., Router API).
   */
  static fromAny(any: Any): Message
  static fromAny<T extends DescMessage>(schema: T, any: Any): Message<T>
  static fromAny<T extends DescMessage>(first: T | Any, second?: Any): Message | Message<T> {
    if (second !== undefined) {
      const schema = first as T
      const value = anyUnpack(second, schema)
      if (!value) {
        throw new InitiaError(
          `fromAny type mismatch: expected /${schema.typeName}, got ${second.typeUrl}`
        )
      }
      return new Message(schema, value)
    }
    const msg = Object.create(Message.prototype) as Message
    msg._rawAny = first as Any
    return msg
  }
}

/**
 * Flexible message input accepted by signAndBroadcast, createTx, etc.
 *
 * - `Message` — from msg builders, `msgs.custom(schema, init)`, or `new Message(schema, init)`
 * - `Any` — pre-serialized protobuf (DIRECT signing only)
 */
export type MsgInput = Message | Any

/**
 * Normalize a MsgInput to a Message instance.
 * @internal
 */
export function normalizeMsg(input: MsgInput): Message {
  if (input instanceof Message) return input
  return Message.fromAny(input)
}

/**
 * Feegrant allowance options for BasicAllowance.
 */
export interface AllowanceOptions {
  /** Maximum spend limit (optional - unlimited if not set) */
  spendLimit?: Coin[]
  /** Expiration time (optional - never expires if not set) */
  expiration?: Date
}

/**
 * Group member definition.
 */
export interface GroupMember {
  /** Member address */
  address: string
  /** Voting weight (as string for precision) */
  weight: string
  /** Optional metadata */
  metadata?: string
}

/**
 * IBC transfer options.
 */
export interface IbcTransferOptions {
  /** Source port (default: 'transfer') */
  sourcePort?: string
  /** Timeout height */
  timeoutHeight?: { revisionNumber: Numeric; revisionHeight: Numeric }
  /** Timeout timestamp in nanoseconds */
  timeoutTimestamp?: Numeric
  /** Optional memo */
  memo?: string
}

// =============================================================================
// Object syntax input types
// =============================================================================

/** Object input for {@link BaseMsgs.send}. */
export interface SendInput {
  from: string
  to: string
  amount: Coin | Coin[]
}

/** Object input for {@link BaseMsgs.transfer}. */
export interface TransferInput extends IbcTransferOptions {
  sender: string
  receiver: string
  token: Coin
  channel: string
}

/** Object input for delegate / undelegate. */
export interface DelegateInput {
  delegator: string
  validator: string
  amount: Coin | Coin[]
}

/** Object input for {@link InitiaMsgs.redelegate}. */
export interface RedelegateInput {
  delegator: string
  srcValidator: string
  dstValidator: string
  amount: Coin | Coin[]
}

/** Object input for Move execute. */
export interface MoveExecuteInput {
  sender: string
  moduleAddress: string
  moduleName: string
  functionName: string
  typeArgs: string[]
  args: Uint8Array[]
}

/**
 * Base message builders available on all chains.
 */
export interface BaseMsgs {
  /**
   * Send tokens to another address.
   */
  send(from: string, to: string, amount: Coin | Coin[]): Message<typeof MsgSendSchema>
  send(input: SendInput): Message<typeof MsgSendSchema>

  /**
   * IBC transfer tokens to another chain.
   */
  transfer(
    sender: string,
    receiver: string,
    token: Coin,
    channel: string,
    options?: IbcTransferOptions
  ): Message<typeof MsgTransferSchema>
  transfer(input: TransferInput): Message<typeof MsgTransferSchema>

  /**
   * Create a custom message from any protobuf schema.
   */
  custom<T extends DescMessage>(schema: T, data: MessageInitShape<T>): Message<T>
}

/**
 * Initia L1 message builders.
 * Includes staking, Move, and governance.
 */
export interface InitiaMsgs extends BaseMsgs {
  /** Delegate tokens to a validator */
  delegate(
    delegator: string,
    validator: string,
    amount: Coin | Coin[]
  ): Message<typeof MsgDelegateSchema>
  delegate(input: DelegateInput): Message<typeof MsgDelegateSchema>

  /** Undelegate tokens from a validator */
  undelegate(
    delegator: string,
    validator: string,
    amount: Coin | Coin[]
  ): Message<typeof MsgUndelegateSchema>
  undelegate(input: DelegateInput): Message<typeof MsgUndelegateSchema>

  /** Redelegate tokens between validators */
  redelegate(
    delegator: string,
    srcValidator: string,
    dstValidator: string,
    amount: Coin | Coin[]
  ): Message<typeof MsgBeginRedelegateSchema>
  redelegate(input: RedelegateInput): Message<typeof MsgBeginRedelegateSchema>

  /** Withdraw staking rewards */
  withdrawRewards(
    delegator: string,
    validator: string
  ): Message<typeof MsgWithdrawDelegatorRewardSchema>

  /** Execute a Move function */
  execute(
    sender: string,
    moduleAddress: string,
    moduleName: string,
    functionName: string,
    typeArgs: string[],
    args: Uint8Array[]
  ): Message<typeof MsgExecuteSchema>
  execute(input: MoveExecuteInput): Message<typeof MsgExecuteSchema>

  /** Execute a Move script */
  script(
    sender: string,
    codeBytes: Uint8Array,
    typeArgs: string[],
    args: Uint8Array[]
  ): Message<typeof MsgScriptSchema>

  /** Vote on a governance proposal (1=yes, 2=abstain, 3=no, 4=no_with_veto) */
  vote(proposalId: Numeric, voter: string, option: number): Message<typeof MsgVoteSchema>

  /** Deposit tokens to a governance proposal */
  deposit(proposalId: Numeric, depositor: string, amount: Coin[]): Message<typeof MsgDepositSchema>

  // ============= Authz =============

  /**
   * Grant authorization to another account.
   * @param granter - Address granting the authorization
   * @param grantee - Address receiving the authorization
   * @param authorization - The authorization message (as Message)
   * @param expiration - Optional expiration time
   */
  authzGrant(
    granter: string,
    grantee: string,
    authorization: Message,
    expiration?: Date
  ): Message<typeof MsgGrantSchema>

  /**
   * Execute messages on behalf of the granter.
   * @param grantee - Address executing the authorization
   * @param msgs - Messages to execute
   */
  authzExec(grantee: string, msgs: Message[]): Message<typeof MsgExecSchema>

  /**
   * Revoke a previously granted authorization.
   * @param granter - Address that granted the authorization
   * @param grantee - Address that received the authorization
   * @param msgTypeUrl - Type URL of the message to revoke
   */
  authzRevoke(granter: string, grantee: string, msgTypeUrl: string): Message<typeof MsgRevokeSchema>

  // ============= Feegrant =============

  /**
   * Grant fee allowance to another account.
   * Creates a BasicAllowance with optional spend limit and expiration.
   * @param granter - Address granting the allowance
   * @param grantee - Address receiving the allowance
   * @param options - Allowance options (spendLimit, expiration)
   */
  grantAllowance(
    granter: string,
    grantee: string,
    options?: AllowanceOptions
  ): Message<typeof MsgGrantAllowanceSchema>

  /**
   * Revoke fee allowance from another account.
   * @param granter - Address that granted the allowance
   * @param grantee - Address that received the allowance
   */
  revokeAllowance(granter: string, grantee: string): Message<typeof MsgRevokeAllowanceSchema>

  // ============= Group =============

  /**
   * Create a new group.
   * @param admin - Admin address for the group
   * @param members - List of group members with weights
   * @param metadata - Optional group metadata
   */
  createGroup(
    admin: string,
    members: GroupMember[],
    metadata?: string
  ): Message<typeof MsgCreateGroupSchema>

  /**
   * Vote on a group proposal.
   * @param proposalId - ID of the proposal
   * @param voter - Voter address
   * @param option - Vote option (1=yes, 2=abstain, 3=no, 4=no_with_veto)
   * @param metadata - Optional vote metadata
   */
  groupVote(
    proposalId: Numeric,
    voter: string,
    option: number,
    metadata?: string
  ): Message<typeof MsgGroupVoteSchema>
}

/**
 * Minimove rollup message builders.
 * Includes Move execution.
 */
export interface MinimoveMsgs extends BaseMsgs {
  /** Execute a Move function */
  execute(
    sender: string,
    moduleAddress: string,
    moduleName: string,
    functionName: string,
    typeArgs: string[],
    args: Uint8Array[]
  ): Message<typeof MsgExecuteSchema>
  execute(input: MoveExecuteInput): Message<typeof MsgExecuteSchema>

  /** Execute a Move script */
  script(
    sender: string,
    codeBytes: Uint8Array,
    typeArgs: string[],
    args: Uint8Array[]
  ): Message<typeof MsgScriptSchema>
}

/**
 * Miniwasm rollup message builders.
 * Includes CosmWasm contract operations.
 */
export interface MiniwasmMsgs extends BaseMsgs {
  /** Store wasm bytecode on chain */
  storeCode(sender: string, wasmByteCode: Uint8Array): Message<typeof MsgStoreCodeSchema>

  /** Instantiate a new contract */
  instantiate(
    sender: string,
    codeId: Numeric,
    msg: object,
    label: string,
    funds?: Coin[]
  ): Message<typeof MsgInstantiateContractSchema>

  /** Execute a contract method */
  executeContract(
    sender: string,
    contract: string,
    msg: object,
    funds?: Coin[]
  ): Message<typeof MsgExecuteContractSchema>

  /** Migrate a contract to new code */
  migrate(
    sender: string,
    contract: string,
    codeId: Numeric,
    msg: object
  ): Message<typeof MsgMigrateContractSchema>
}

/**
 * Minievm rollup message builders.
 * Includes EVM contract operations.
 */
export interface MinievmMsgs extends BaseMsgs {
  /** Call an EVM contract */
  call(
    sender: string,
    contractAddr: string,
    input: Uint8Array,
    value?: string
  ): Message<typeof MsgCallSchema>

  /** Deploy an EVM contract */
  create(sender: string, code: Uint8Array, value?: string): Message<typeof MsgCreateSchema>
}

/**
 * Map chain type to its message builder interface.
 */
interface MsgsMap {
  initia: InitiaMsgs
  minimove: MinimoveMsgs
  miniwasm: MiniwasmMsgs
  minievm: MinievmMsgs
  other: BaseMsgs
}

export type MsgsForChain<T extends ChainType> = MsgsMap[T]
