import { describe, expect, test } from 'bun:test';
import { normalizePhone, generateOtp } from '../services/otp.js';

// ---------------------------------------------------------------------------
// normalizePhone
// ---------------------------------------------------------------------------
describe('normalizePhone', () => {
  test('local 9-digit number is prefixed with 351', () => {
    expect(normalizePhone('912345678')).toBe('351912345678');
  });

  test('+351 prefix is normalized to 351', () => {
    expect(normalizePhone('+351912345678')).toBe('351912345678');
  });

  test('351 prefix without + is kept as-is', () => {
    expect(normalizePhone('351912345678')).toBe('351912345678');
  });

  test('00351 prefix is normalized to 351', () => {
    expect(normalizePhone('00351912345678')).toBe('351912345678');
  });

  test('handles spaces in phone number', () => {
    expect(normalizePhone('912 345 678')).toBe('351912345678');
  });

  test('handles dashes in phone number', () => {
    expect(normalizePhone('912-345-678')).toBe('351912345678');
  });

  test('handles +351 with spaces', () => {
    expect(normalizePhone('+351 912 345 678')).toBe('351912345678');
  });
});

// ---------------------------------------------------------------------------
// generateOtp
// ---------------------------------------------------------------------------
describe('generateOtp', () => {
  test('returns a string', () => {
    const otp = generateOtp();
    expect(typeof otp).toBe('string');
  });

  test('returns a 6-digit string', () => {
    const otp = generateOtp();
    expect(otp).toHaveLength(6);
  });

  test('contains only digits', () => {
    const otp = generateOtp();
    expect(otp).toMatch(/^\d{6}$/);
  });

  test('numeric value is between 100000 and 999999', () => {
    const otp = generateOtp();
    const num = parseInt(otp, 10);
    expect(num).toBeGreaterThanOrEqual(100000);
    expect(num).toBeLessThanOrEqual(999999);
  });

  test('generates different OTPs on successive calls', () => {
    const otps = new Set<string>();
    for (let i = 0; i < 20; i++) {
      otps.add(generateOtp());
    }
    // With 20 random 6-digit codes, we should have more than 1 unique value
    expect(otps.size).toBeGreaterThan(1);
  });
});
