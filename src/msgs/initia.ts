/**
 * Initia L1 message builders.
 *
 * Includes staking (mstaking), Move VM, and governance messages.
 */

import type { Numeric } from '../types'
import { create } from '@bufbuild/protobuf'
import { anyPack } from '../util/any'

// Initia mstaking (multi-staking)
import {
  MsgDelegateSchema,
  MsgUndelegateSchema,
  MsgBeginRedelegateSchema,
} from '@buf/initia-labs_initia.bufbuild_es/initia/mstaking/v1/tx_pb'

// Cosmos distribution (rewards)
import { MsgWithdrawDelegatorRewardSchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/distribution/v1beta1/tx_pb'

// Move VM (shared with minimove)
import { execute, script } from './move'

// Cosmos governance
import {
  MsgVoteSchema,
  MsgDepositSchema,
} from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/gov/v1/tx_pb'

// Cosmos authz
import {
  MsgGrantSchema,
  MsgExecSchema,
  MsgRevokeSchema,
} from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/authz/v1beta1/tx_pb'
import { GrantSchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/authz/v1beta1/authz_pb'

// Cosmos feegrant
import {
  MsgGrantAllowanceSchema,
  MsgRevokeAllowanceSchema,
} from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/feegrant/v1beta1/tx_pb'
import { BasicAllowanceSchema } from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/feegrant/v1beta1/feegrant_pb'

// Cosmos group
import {
  MsgCreateGroupSchema,
  MsgVoteSchema as MsgGroupVoteSchema,
} from '@buf/cosmos_cosmos-sdk.bufbuild_es/cosmos/group/v1/tx_pb'
import { timestampFromDate } from '@bufbuild/protobuf/wkt'

import type { Coin } from '../core/coin'
import {
  Message,
  type InitiaMsgs,
  type AllowanceOptions,
  type GroupMember,
  type DelegateInput,
  type RedelegateInput,
} from './types'
import { baseMsgs, toProtoCoins } from './base'

/**
 * Delegate tokens to a validator.
 * Accepts positional args or an object: `delegate({ delegator, validator, amount })`.
 */
function delegate(
  delegatorOrInput: string | DelegateInput,
  validator?: string,
  amount?: Coin | Coin[]
): Message<typeof MsgDelegateSchema> {
  if (typeof delegatorOrInput !== 'string') {
    return new Message(MsgDelegateSchema, {
      delegatorAddress: delegatorOrInput.delegator,
      validatorAddress: delegatorOrInput.validator,
      amount: toProtoCoins(delegatorOrInput.amount),
    })
  }
  return new Message(MsgDelegateSchema, {
    delegatorAddress: delegatorOrInput,
    validatorAddress: validator!,
    amount: toProtoCoins(amount),
  })
}

/**
 * Undelegate tokens from a validator.
 * Accepts positional args or an object: `undelegate({ delegator, validator, amount })`.
 */
function undelegate(
  delegatorOrInput: string | DelegateInput,
  validator?: string,
  amount?: Coin | Coin[]
): Message<typeof MsgUndelegateSchema> {
  if (typeof delegatorOrInput !== 'string') {
    return new Message(MsgUndelegateSchema, {
      delegatorAddress: delegatorOrInput.delegator,
      validatorAddress: delegatorOrInput.validator,
      amount: toProtoCoins(delegatorOrInput.amount),
    })
  }
  return new Message(MsgUndelegateSchema, {
    delegatorAddress: delegatorOrInput,
    validatorAddress: validator!,
    amount: toProtoCoins(amount),
  })
}

/**
 * Redelegate tokens between validators.
 * Accepts positional args or an object: `redelegate({ delegator, srcValidator, dstValidator, amount })`.
 */
function redelegate(
  delegatorOrInput: string | RedelegateInput,
  srcValidator?: string,
  dstValidator?: string,
  amount?: Coin | Coin[]
): Message<typeof MsgBeginRedelegateSchema> {
  if (typeof delegatorOrInput !== 'string') {
    return new Message(MsgBeginRedelegateSchema, {
      delegatorAddress: delegatorOrInput.delegator,
      validatorSrcAddress: delegatorOrInput.srcValidator,
      validatorDstAddress: delegatorOrInput.dstValidator,
      amount: toProtoCoins(delegatorOrInput.amount),
    })
  }
  return new Message(MsgBeginRedelegateSchema, {
    delegatorAddress: delegatorOrInput,
    validatorSrcAddress: srcValidator!,
    validatorDstAddress: dstValidator!,
    amount: toProtoCoins(amount),
  })
}

/**
 * Withdraw staking rewards from a validator.
 */
function withdrawRewards(
  delegator: string,
  validator: string
): Message<typeof MsgWithdrawDelegatorRewardSchema> {
  return new Message(MsgWithdrawDelegatorRewardSchema, {
    delegatorAddress: delegator,
    validatorAddress: validator,
  })
}

/**
 * Vote on a governance proposal.
 * @param option - 1=yes, 2=abstain, 3=no, 4=no_with_veto
 */
function vote(proposalId: Numeric, voter: string, option: number): Message<typeof MsgVoteSchema> {
  return new Message(MsgVoteSchema, {
    proposalId: BigInt(proposalId),
    voter,
    option,
    metadata: '',
  })
}

/**
 * Deposit tokens to a governance proposal.
 */
function deposit(
  proposalId: Numeric,
  depositor: string,
  amount: Coin[]
): Message<typeof MsgDepositSchema> {
  return new Message(MsgDepositSchema, {
    proposalId: BigInt(proposalId),
    depositor,
    amount: toProtoCoins(amount),
  })
}

// ============= Authz =============

/**
 * Grant authorization to another account.
 */
function authzGrant(
  granter: string,
  grantee: string,
  authorization: Message,
  expiration?: Date
): Message<typeof MsgGrantSchema> {
  const grant = create(GrantSchema, {
    authorization: authorization.toAny(),
    expiration: expiration ? timestampFromDate(expiration) : undefined,
  })

  return new Message(MsgGrantSchema, {
    granter,
    grantee,
    grant,
  })
}

/**
 * Execute messages on behalf of the granter.
 */
function authzExec(grantee: string, msgs: Message[]): Message<typeof MsgExecSchema> {
  return new Message(MsgExecSchema, {
    grantee,
    msgs: msgs.map(m => m.toAny()),
  })
}

/**
 * Revoke a previously granted authorization.
 */
function authzRevoke(
  granter: string,
  grantee: string,
  msgTypeUrl: string
): Message<typeof MsgRevokeSchema> {
  return new Message(MsgRevokeSchema, {
    granter,
    grantee,
    msgTypeUrl,
  })
}

// ============= Feegrant =============

/**
 * Grant fee allowance to another account.
 */
function grantAllowance(
  granter: string,
  grantee: string,
  options?: AllowanceOptions
): Message<typeof MsgGrantAllowanceSchema> {
  // Create BasicAllowance
  const basicAllowance = create(BasicAllowanceSchema, {
    spendLimit: options?.spendLimit ? toProtoCoins(options.spendLimit) : [],
    expiration: options?.expiration ? timestampFromDate(options.expiration) : undefined,
  })

  return new Message(MsgGrantAllowanceSchema, {
    granter,
    grantee,
    allowance: anyPack(BasicAllowanceSchema, basicAllowance),
  })
}

/**
 * Revoke fee allowance from another account.
 */
function revokeAllowance(
  granter: string,
  grantee: string
): Message<typeof MsgRevokeAllowanceSchema> {
  return new Message(MsgRevokeAllowanceSchema, {
    granter,
    grantee,
  })
}

// ============= Group =============

/**
 * Create a new group.
 */
function createGroup(
  admin: string,
  members: GroupMember[],
  metadata?: string
): Message<typeof MsgCreateGroupSchema> {
  return new Message(MsgCreateGroupSchema, {
    admin,
    members: members.map(m => ({
      address: m.address,
      weight: m.weight,
      metadata: m.metadata ?? '',
    })),
    metadata: metadata ?? '',
  })
}

/**
 * Vote on a group proposal.
 * @param option - 1=yes, 2=abstain, 3=no, 4=no_with_veto
 */
function groupVote(
  proposalId: Numeric,
  voter: string,
  option: number,
  metadata?: string
): Message<typeof MsgGroupVoteSchema> {
  return new Message(MsgGroupVoteSchema, {
    proposalId: BigInt(proposalId),
    voter,
    option,
    metadata: metadata ?? '',
  })
}

/**
 * Initia L1 message builders instance.
 * Extends base messages with staking, Move, and governance.
 */
export const initiaMsgs: InitiaMsgs = {
  // Base messages
  ...baseMsgs,

  // Staking (mstaking)
  delegate,
  undelegate,
  redelegate,
  withdrawRewards,

  // Move
  execute,
  script,

  // Governance
  vote,
  deposit,

  // Authz
  authzGrant,
  authzExec,
  authzRevoke,

  // Feegrant
  grantAllowance,
  revokeAllowance,

  // Group
  createGroup,
  groupVote,
}
