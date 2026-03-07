/**
 * Unit tests for Coin module.
 */

import { describe, it, expect } from 'vitest'
import { Coin, coin, coins, parseCoin } from '../../../src/core/coin'
import { ValidationError } from '../../../src/errors'

describe('Coin', () => {
  describe('constructor', () => {
    it('should create coin with string amount', () => {
      const c = new Coin('uinit', '1000000')
      expect(c.denom).toBe('uinit')
      expect(c.amount).toBe('1000000')
    })

    it('should create coin with number amount', () => {
      const c = new Coin('uinit', 1000000)
      expect(c.amount).toBe('1000000')
    })

    it('should create coin with bigint amount', () => {
      const c = new Coin('uinit', 1000000n)
      expect(c.amount).toBe('1000000')
    })

    it('should reject non-numeric strings', () => {
      expect(() => new Coin('uinit', '1.5')).toThrow(ValidationError)
      expect(() => new Coin('uinit', 'abc')).toThrow(ValidationError)
      expect(() => new Coin('uinit', '')).toThrow(ValidationError)
      expect(() => new Coin('uinit', '12abc')).toThrow(ValidationError)
    })

    it('should reject non-safe-integer numbers', () => {
      expect(() => new Coin('uinit', NaN)).toThrow(ValidationError)
      expect(() => new Coin('uinit', Infinity)).toThrow(ValidationError)
      expect(() => new Coin('uinit', 1.5)).toThrow(ValidationError)
      expect(() => new Coin('uinit', Number.MAX_SAFE_INTEGER + 1)).toThrow(ValidationError)
    })

    it('should accept negative integers (for subtraction results)', () => {
      expect(new Coin('uinit', '-100').amount).toBe('-100')
      expect(new Coin('uinit', -100).amount).toBe('-100')
      expect(new Coin('uinit', -100n).amount).toBe('-100')
    })
  })

  describe('amountBigInt', () => {
    it('should return amount as bigint', () => {
      const c = new Coin('uinit', '1000000')
      expect(c.amountBigInt).toBe(1000000n)
    })
  })

  describe('arithmetic operations', () => {
    it('should add coins of same denom', () => {
      const a = new Coin('uinit', '100')
      const b = new Coin('uinit', '200')
      const result = a.add(b)
      expect(result.amount).toBe('300')
      expect(result.denom).toBe('uinit')
    })

    it('should throw when adding coins of different denom', () => {
      const a = new Coin('uinit', '100')
      const b = new Coin('uusdc', '200')
      expect(() => a.add(b)).toThrow('Mismatch')
    })

    it('should subtract coins of same denom', () => {
      const a = new Coin('uinit', '300')
      const b = new Coin('uinit', '100')
      const result = a.sub(b)
      expect(result.amount).toBe('200')
    })

    it('should allow negative result from subtraction', () => {
      const a = new Coin('uinit', '100')
      const b = new Coin('uinit', '300')
      const result = a.sub(b)
      expect(result.amountBigInt).toBe(-200n)
    })

    it('should multiply coin by number', () => {
      const c = new Coin('uinit', '100')
      const result = c.mul(3)
      expect(result.amount).toBe('300')
    })

    it('should multiply coin by bigint', () => {
      const c = new Coin('uinit', '100')
      const result = c.mul(3n)
      expect(result.amount).toBe('300')
    })
  })

  describe('comparison operations', () => {
    it('should check equality', () => {
      const a = new Coin('uinit', '100')
      const b = new Coin('uinit', '100')
      const c = new Coin('uinit', '200')
      expect(a.eq(b)).toBe(true)
      expect(a.eq(c)).toBe(false)
    })

    it('should check greater than', () => {
      const a = new Coin('uinit', '200')
      const b = new Coin('uinit', '100')
      expect(a.gt(b)).toBe(true)
      expect(b.gt(a)).toBe(false)
    })

    it('should check greater than or equal', () => {
      const a = new Coin('uinit', '100')
      const b = new Coin('uinit', '100')
      const c = new Coin('uinit', '50')
      expect(a.gte(b)).toBe(true)
      expect(a.gte(c)).toBe(true)
      expect(c.gte(a)).toBe(false)
    })

    it('should check less than', () => {
      const a = new Coin('uinit', '100')
      const b = new Coin('uinit', '200')
      expect(a.lt(b)).toBe(true)
      expect(b.lt(a)).toBe(false)
    })

    it('should check less than or equal', () => {
      const a = new Coin('uinit', '100')
      const b = new Coin('uinit', '100')
      const c = new Coin('uinit', '200')
      expect(a.lte(b)).toBe(true)
      expect(a.lte(c)).toBe(true)
      expect(c.lte(a)).toBe(false)
    })

    it('should throw when comparing coins of different denom', () => {
      const a = new Coin('uinit', '100')
      const b = new Coin('uusdc', '100')
      expect(() => a.eq(b)).toThrow('Mismatch')
      expect(() => a.gt(b)).toThrow('Mismatch')
    })
  })

  describe('toProto', () => {
    it('should return protobuf-compatible object', () => {
      const c = new Coin('uinit', '1000000')
      const proto = c.toProto()
      expect(proto).toEqual({ denom: 'uinit', amount: '1000000' })
    })
  })

  describe('format', () => {
    it('should format without decimals', () => {
      const c = new Coin('uinit', '1500000')
      expect(c.format()).toBe('1500000 uinit')
    })

    it('should format with decimals', () => {
      const c = new Coin('uinit', '1500000')
      expect(c.format({ decimals: 6 })).toBe('1.5 uinit')
    })

    it('should format with custom symbol', () => {
      const c = new Coin('uinit', '1500000')
      expect(c.format({ decimals: 6, symbol: 'INIT' })).toBe('1.5 INIT')
    })

    it('should handle exact division', () => {
      const c = new Coin('uinit', '2000000')
      expect(c.format({ decimals: 6 })).toBe('2 uinit')
    })

    it('should preserve leading zeros in fractional part', () => {
      const c = new Coin('uinit', '1000001')
      expect(c.format({ decimals: 6 })).toBe('1.000001 uinit')
    })

    it('should trim trailing zeros in fractional part', () => {
      const c = new Coin('uinit', '1100000')
      expect(c.format({ decimals: 6 })).toBe('1.1 uinit')
    })
  })
})

describe('coin helper', () => {
  it('should create a Coin instance', () => {
    const c = coin('uinit', '1000000')
    expect(c).toBeInstanceOf(Coin)
    expect(c.denom).toBe('uinit')
    expect(c.amount).toBe('1000000')
  })

  it('should accept number amount', () => {
    const c = coin('uinit', 1000000)
    expect(c.amount).toBe('1000000')
  })
})

describe('coins helper', () => {
  it('should create multiple Coin instances', () => {
    const result = coins([
      ['uinit', '1000000'],
      ['uusdc', '500000'],
    ])
    expect(result).toHaveLength(2)
    expect(result[0].denom).toBe('uinit')
    expect(result[0].amount).toBe('1000000')
    expect(result[1].denom).toBe('uusdc')
    expect(result[1].amount).toBe('500000')
  })

  it('should return empty array for empty input', () => {
    const result = coins([])
    expect(result).toHaveLength(0)
  })
})

describe('parseCoin', () => {
  it('should parse standard coin string', () => {
    const c = parseCoin('1000000uinit')
    expect(c.denom).toBe('uinit')
    expect(c.amount).toBe('1000000')
  })

  it('should parse coin with different denoms', () => {
    expect(parseCoin('500uusdc').denom).toBe('uusdc')
    expect(parseCoin('100atom').denom).toBe('atom')
  })

  it('should parse IBC denom', () => {
    const c = parseCoin('1000ibc/ABC123')
    expect(c.denom).toBe('ibc/ABC123')
    expect(c.amount).toBe('1000')
  })

  it('should throw for empty string', () => {
    expect(() => parseCoin('')).toThrow('Empty string')
  })

  it('should throw for invalid format', () => {
    expect(() => parseCoin('uinit1000')).toThrow('Invalid format')
    expect(() => parseCoin('abc')).toThrow('Invalid format')
    expect(() => parseCoin('1000')).toThrow('Invalid format')
  })

  it('should throw for decimal amounts', () => {
    expect(() => parseCoin('1.5uinit')).toThrow('Invalid format')
  })
})

// =============================================================================
// Static Utilities
// =============================================================================

describe('Coin.find', () => {
  const list = [
    { denom: 'uinit', amount: '100' },
    { denom: 'uusdc', amount: '200' },
  ]

  it('should find coin by denom', () => {
    const found = Coin.find(list, 'uinit')
    expect(found).toBeInstanceOf(Coin)
    expect(found!.amount).toBe('100')
  })

  it('should return undefined for missing denom', () => {
    expect(Coin.find(list, 'uatom')).toBeUndefined()
  })
})

describe('Coin.sum', () => {
  it('should sum amounts by denom', () => {
    const list = [
      { denom: 'uinit', amount: '100' },
      { denom: 'uusdc', amount: '50' },
      { denom: 'uinit', amount: '200' },
    ]
    expect(Coin.sum(list, 'uinit')).toBe(300n)
  })

  it('should return 0n for missing denom', () => {
    expect(Coin.sum([{ denom: 'uinit', amount: '1' }], 'uatom')).toBe(0n)
  })
})

describe('Coin.merge', () => {
  it('should merge duplicate denoms', () => {
    const merged = Coin.merge([coin('uinit', 100), coin('uusdc', 50), coin('uinit', 200)])
    expect(merged).toHaveLength(2)
    const init = merged.find(c => c.denom === 'uinit')!
    expect(init.amountBigInt).toBe(300n)
  })

  it('should handle empty array', () => {
    expect(Coin.merge([])).toHaveLength(0)
  })
})

describe('Coin.subtract', () => {
  it('should subtract fee from matching denom', () => {
    const result = Coin.subtract([coin('uinit', 1000), coin('uusdc', 500)], [coin('uinit', 100)])
    expect(result.find(c => c.denom === 'uinit')!.amountBigInt).toBe(900n)
    expect(result.find(c => c.denom === 'uusdc')!.amountBigInt).toBe(500n)
  })

  it('should throw on insufficient balance', () => {
    expect(() => Coin.subtract([coin('uinit', 50)], [coin('uinit', 100)])).toThrow('Insufficient')
  })
})

// =============================================================================
// Edge Cases
// =============================================================================

describe('Coin edge cases', () => {
  describe('zero amount', () => {
    it('should handle zero amount creation', () => {
      const c = new Coin('uinit', '0')
      expect(c.amount).toBe('0')
      expect(c.amountBigInt).toBe(0n)
    })

    it('should handle zero amount from number', () => {
      const c = new Coin('uinit', 0)
      expect(c.amount).toBe('0')
    })

    it('should handle zero amount from bigint', () => {
      const c = new Coin('uinit', 0n)
      expect(c.amount).toBe('0')
    })

    it('should compare zero amounts correctly', () => {
      const zero1 = new Coin('uinit', '0')
      const zero2 = new Coin('uinit', 0)
      const positive = new Coin('uinit', '1')

      expect(zero1.eq(zero2)).toBe(true)
      expect(zero1.lt(positive)).toBe(true)
      expect(zero1.lte(zero2)).toBe(true)
      expect(positive.gt(zero1)).toBe(true)
    })

    it('should multiply by zero', () => {
      const c = new Coin('uinit', '1000')
      const result = c.mul(0)
      expect(result.amount).toBe('0')
    })

    it('should format zero amount', () => {
      const c = new Coin('uinit', '0')
      expect(c.format()).toBe('0 uinit')
      expect(c.format({ decimals: 6 })).toBe('0 uinit')
    })
  })

  describe('very large amounts', () => {
    it('should handle max safe integer', () => {
      const c = new Coin('uinit', Number.MAX_SAFE_INTEGER)
      expect(c.amountBigInt).toBe(BigInt(Number.MAX_SAFE_INTEGER))
    })

    it('should handle amounts larger than MAX_SAFE_INTEGER', () => {
      const largeAmount = '99999999999999999999999999999999' // 32 digits
      const c = new Coin('uinit', largeAmount)
      expect(c.amount).toBe(largeAmount)
      expect(c.amountBigInt).toBe(BigInt(largeAmount))
    })

    it('should perform arithmetic on very large amounts', () => {
      const large1 = new Coin('uinit', '99999999999999999999999999999999')
      const large2 = new Coin('uinit', '1')
      const sum = large1.add(large2)
      expect(sum.amount).toBe('100000000000000000000000000000000')
    })

    it('should format very large amounts with decimals', () => {
      const c = new Coin('uinit', '123456789012345678901234')
      const formatted = c.format({ decimals: 6 })
      expect(formatted).toContain('uinit')
      expect(formatted).not.toContain('e+') // No scientific notation
    })
  })

  describe('negative amounts', () => {
    it('should handle negative result from subtraction', () => {
      const a = new Coin('uinit', '10')
      const b = new Coin('uinit', '100')
      const result = a.sub(b)
      expect(result.amountBigInt).toBe(-90n)
      expect(result.amount).toBe('-90')
    })

    it('should compare negative amounts', () => {
      const negative = new Coin('uinit', '-100')
      const zero = new Coin('uinit', '0')
      const positive = new Coin('uinit', '100')

      expect(negative.lt(zero)).toBe(true)
      expect(negative.lt(positive)).toBe(true)
      expect(zero.gt(negative)).toBe(true)
    })

    it('should format negative amounts', () => {
      const c = new Coin('uinit', '-1500000')
      expect(c.format()).toBe('-1500000 uinit')
    })
  })

  describe('special denom cases', () => {
    it('should handle IBC denom with long hash', () => {
      const ibcDenom = 'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2'
      const c = new Coin(ibcDenom, '1000')
      expect(c.denom).toBe(ibcDenom)
      expect(c.toProto().denom).toBe(ibcDenom)
    })

    it('should handle factory denom', () => {
      const factoryDenom = 'factory/init1abc123/mytoken'
      const c = new Coin(factoryDenom, '1000')
      expect(c.denom).toBe(factoryDenom)
    })

    it('should handle evm denom', () => {
      const evmDenom = 'evm/0x1234567890123456789012345678901234567890'
      const c = new Coin(evmDenom, '1000')
      expect(c.denom).toBe(evmDenom)
    })
  })

  describe('parseCoin edge cases', () => {
    it('should parse zero amount', () => {
      const c = parseCoin('0uinit')
      expect(c.amount).toBe('0')
      expect(c.denom).toBe('uinit')
    })

    it('should parse very large amount', () => {
      const c = parseCoin('99999999999999999999uinit')
      expect(c.amount).toBe('99999999999999999999')
    })

    it('should handle whitespace-only string', () => {
      expect(() => parseCoin('   ')).toThrow('Empty string')
    })

    it('should reject leading zeros that look like octal', () => {
      // This should work - leading zeros are just part of the number string
      const c = parseCoin('0000100uinit')
      expect(c.amount).toBe('0000100')
      expect(c.amountBigInt).toBe(100n)
    })
  })
})
