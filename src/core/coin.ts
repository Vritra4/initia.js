/**
 * Coin module - Immutable coin representation for blockchain amounts.
 */

import { ValidationError, ParseError } from '../errors'

/**
 * Object with denom and amount fields (compatible with protobuf Coin).
 */
export interface CoinLike {
  readonly denom: string
  readonly amount: string | bigint | number
}

/**
 * Immutable coin class for representing blockchain token amounts.
 *
 * Uses BigInt internally for precise arithmetic operations.
 * All operations return new Coin instances (immutable).
 *
 * @example
 * ```typescript
 * const fee = new Coin('uinit', 1000)
 * const doubled = fee.mul(2)
 * console.log(doubled.amount) // '2000'
 * ```
 */
export class Coin {
  readonly denom: string
  private readonly _amount: string

  constructor(denom: string, amount: string | bigint | number) {
    this.denom = denom
    this._amount = String(amount)
  }

  /**
   * Get amount as string (protobuf compatible).
   */
  get amount(): string {
    return this._amount
  }

  /**
   * Get amount as BigInt (for arithmetic operations).
   */
  get amountBigInt(): bigint {
    return BigInt(this._amount)
  }

  /**
   * Add another coin of the same denom.
   * @throws Error if denoms don't match
   */
  add(other: Coin): Coin {
    this.assertSameDenom(other)
    return new Coin(this.denom, this.amountBigInt + other.amountBigInt)
  }

  /**
   * Subtract another coin of the same denom.
   * @throws Error if denoms don't match
   */
  sub(other: Coin): Coin {
    this.assertSameDenom(other)
    return new Coin(this.denom, this.amountBigInt - other.amountBigInt)
  }

  /**
   * Multiply by a scalar value.
   */
  mul(n: bigint | number): Coin {
    return new Coin(this.denom, this.amountBigInt * BigInt(n))
  }

  /**
   * Check equality with another coin.
   * @throws Error if denoms don't match
   */
  eq(other: Coin): boolean {
    this.assertSameDenom(other)
    return this.amountBigInt === other.amountBigInt
  }

  /**
   * Check if greater than another coin.
   * @throws Error if denoms don't match
   */
  gt(other: Coin): boolean {
    this.assertSameDenom(other)
    return this.amountBigInt > other.amountBigInt
  }

  /**
   * Check if greater than or equal to another coin.
   * @throws Error if denoms don't match
   */
  gte(other: Coin): boolean {
    this.assertSameDenom(other)
    return this.amountBigInt >= other.amountBigInt
  }

  /**
   * Check if less than another coin.
   * @throws Error if denoms don't match
   */
  lt(other: Coin): boolean {
    this.assertSameDenom(other)
    return this.amountBigInt < other.amountBigInt
  }

  /**
   * Check if less than or equal to another coin.
   * @throws Error if denoms don't match
   */
  lte(other: Coin): boolean {
    this.assertSameDenom(other)
    return this.amountBigInt <= other.amountBigInt
  }

  /**
   * Convert to protobuf-compatible object.
   */
  toProto(): { denom: string; amount: string } {
    return {
      denom: this.denom,
      amount: this._amount,
    }
  }

  /**
   * Format coin for human-readable display.
   *
   * @param options - Formatting options
   * @param options.decimals - Number of decimal places (for display conversion)
   * @param options.symbol - Custom symbol to display (defaults to denom)
   * @returns Formatted string like '1.5 INIT'
   *
   * @example
   * ```typescript
   * const c = new Coin('uinit', '1500000')
   * c.format() // '1500000 uinit'
   * c.format({ decimals: 6 }) // '1.5 uinit'
   * c.format({ decimals: 6, symbol: 'INIT' }) // '1.5 INIT'
   * ```
   */
  format(options?: { decimals?: number; symbol?: string }): string {
    const symbol = options?.symbol ?? this.denom
    const decimals = options?.decimals

    if (decimals === undefined || decimals === 0) {
      return `${this._amount} ${symbol}`
    }

    const amountBig = this.amountBigInt
    const divisor = 10n ** BigInt(decimals)
    const integerPart = amountBig / divisor
    const fractionalPart = amountBig % divisor

    if (fractionalPart === 0n) {
      return `${integerPart} ${symbol}`
    }

    // Pad fractional part with leading zeros and trim trailing zeros
    const fractionalStr = fractionalPart.toString().padStart(decimals, '0').replace(/0+$/, '')

    return `${integerPart}.${fractionalStr} ${symbol}`
  }

  private assertSameDenom(other: Coin): void {
    if (this.denom !== other.denom) {
      throw new ValidationError('denom', `Mismatch: ${this.denom} vs ${other.denom}`)
    }
  }

  // ===========================================================================
  // Static Coin[] utilities
  // ===========================================================================

  /**
   * Find a single coin by denom from a coin array.
   *
   * @example
   * ```typescript
   * const uinit = Coin.find(balances, 'uinit')
   * ```
   */
  static find(coins: CoinLike[], denom: string): Coin | undefined {
    const found = coins.find(c => c.denom === denom)
    return found ? new Coin(found.denom, found.amount) : undefined
  }

  /**
   * Sum all amounts of a specific denom.
   *
   * @example
   * ```typescript
   * const total = Coin.sum(balances, 'uinit') // → bigint
   * ```
   */
  static sum(coins: CoinLike[], denom: string): bigint {
    let total = 0n
    for (const c of coins) {
      if (c.denom === denom) total += BigInt(c.amount)
    }
    return total
  }

  /**
   * Merge coins with the same denom, summing their amounts.
   *
   * @example
   * ```typescript
   * const merged = Coin.merge([coin('uinit', 100), coin('uinit', 200), coin('uusdc', 50)])
   * // → [Coin('uinit', 300), Coin('uusdc', 50)]
   * ```
   */
  static merge(coins: CoinLike[]): Coin[] {
    const map = new Map<string, bigint>()
    for (const c of coins) {
      map.set(c.denom, (map.get(c.denom) ?? 0n) + BigInt(c.amount))
    }
    return Array.from(map, ([denom, amount]) => new Coin(denom, amount))
  }

  /**
   * Subtract fee coins from a coin array (matching by denom).
   * Returns a new array; denoms not in fee are passed through unchanged.
   *
   * @throws ValidationError if subtraction would result in a negative amount
   *
   * @example
   * ```typescript
   * const remaining = Coin.subtract(balances, [coin('uinit', 10000)])
   * ```
   */
  static subtract(coins: CoinLike[], fee: CoinLike[]): Coin[] {
    const feeMap = new Map<string, bigint>()
    for (const f of fee) {
      feeMap.set(f.denom, (feeMap.get(f.denom) ?? 0n) + BigInt(f.amount))
    }

    return coins.map(c => {
      const feeAmount = feeMap.get(c.denom)
      if (feeAmount === undefined) return new Coin(c.denom, c.amount)
      const result = BigInt(c.amount) - feeAmount
      if (result < 0n) {
        throw new ValidationError(
          'amount',
          `Insufficient ${c.denom}: have ${c.amount}, need ${feeAmount}`
        )
      }
      return new Coin(c.denom, result)
    })
  }
}

/**
 * Create a new Coin instance.
 *
 * @example
 * ```typescript
 * const fee = coin('uinit', 1000)
 * ```
 */
export function coin(denom: string, amount: string | bigint | number): Coin {
  return new Coin(denom, amount)
}

/**
 * Create multiple Coin instances from tuples.
 *
 * @example
 * ```typescript
 * const funds = coins([
 *   ['uinit', 1000],
 *   ['uusdc', 500],
 * ])
 * ```
 */
export function coins(items: [string, string | bigint | number][]): Coin[] {
  return items.map(([denom, amount]) => new Coin(denom, amount))
}

/**
 * Parse a coin string into a Coin instance.
 *
 * Supports formats like '1000000uinit', '100uusdc'.
 * The amount must be a positive integer (no decimals in string).
 *
 * @param str - Coin string to parse (e.g., '1000000uinit')
 * @returns Parsed Coin instance
 * @throws Error if string format is invalid
 *
 * @example
 * ```typescript
 * const c = parseCoin('1000000uinit')
 * console.log(c.denom) // 'uinit'
 * console.log(c.amount) // '1000000'
 * ```
 */
export function parseCoin(str: string): Coin {
  if (!str || str.trim() === '') {
    throw new ParseError('coin', 'Empty string')
  }

  // Match amount (digits) followed by denom (non-digits)
  const match = str.match(/^(\d+)([a-zA-Z][a-zA-Z0-9/]*)$/)
  if (!match) {
    throw new ParseError('coin', `Invalid format: ${str}`)
  }

  const [, amount, denom] = match
  return new Coin(denom, amount)
}
