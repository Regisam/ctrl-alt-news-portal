import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * Example: Basic unit test for a utility function
 *
 * This demonstrates how to test a simple function with:
 * - Setup/teardown
 * - Assertions
 * - Multiple test cases
 */

// Example utility function (would be imported in real usage)
function calculateDiscount(price: number, discountPercent: number): number {
  if (price < 0 || discountPercent < 0 || discountPercent > 100) {
    throw new Error('Invalid price or discount');
  }
  return price * (1 - discountPercent / 100);
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

describe('Utility Functions', () => {
  describe('calculateDiscount', () => {
    it('should calculate discount correctly', () => {
      const result = calculateDiscount(100, 10);
      expect(result).toBe(90);
    });

    it('should handle zero discount', () => {
      const result = calculateDiscount(100, 0);
      expect(result).toBe(100);
    });

    it('should handle full discount', () => {
      const result = calculateDiscount(100, 100);
      expect(result).toBe(0);
    });

    it('should throw error for negative price', () => {
      expect(() => calculateDiscount(-100, 10)).toThrow('Invalid price');
    });

    it('should throw error for invalid discount', () => {
      expect(() => calculateDiscount(100, 150)).toThrow('Invalid');
    });
  });

  describe('validateEmail', () => {
    it('should accept valid emails', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('test.user@domain.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
    });
  });
});

/**
 * Example: Testing with mocks and spies
 */
describe('Functions with mocks', () => {
  let mockCallback: any;

  beforeEach(() => {
    mockCallback = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  function processItem(item: any, callback: Function) {
    // Do some processing
    const result = item * 2;
    callback(result);
    return result;
  }

  it('should call callback with processed result', () => {
    const result = processItem(5, mockCallback);

    expect(result).toBe(10);
    expect(mockCallback).toHaveBeenCalledWith(10);
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });
});

/**
 * Example: Async testing
 */
describe('Async operations', () => {
  async function fetchData(id: number) {
    // Simulate async operation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ id, name: `Item ${id}`, data: 'test' });
      }, 100);
    });
  }

  it('should resolve with data', async () => {
    const data = await fetchData(1);

    expect(data).toEqual({
      id: 1,
      name: 'Item 1',
      data: 'test',
    });
  });

  it('should handle errors', async () => {
    async function failingFetch() {
      throw new Error('Network error');
    }

    await expect(failingFetch()).rejects.toThrow('Network error');
  });
});
