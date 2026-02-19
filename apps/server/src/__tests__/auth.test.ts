import { describe, expect, test } from 'bun:test';
import { generateToken } from '../services/auth.js';

// ---------------------------------------------------------------------------
// generateToken
// ---------------------------------------------------------------------------
describe('generateToken', () => {
  test('returns a string', () => {
    const token = generateToken();
    expect(typeof token).toBe('string');
  });

  test('returns a UUID v4 formatted string', () => {
    const token = generateToken();
    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(token).toMatch(uuidRegex);
  });

  test('returns a 36-character string (standard UUID length)', () => {
    const token = generateToken();
    expect(token).toHaveLength(36);
  });

  test('generates unique tokens on successive calls', () => {
    const token1 = generateToken();
    const token2 = generateToken();
    expect(token1).not.toBe(token2);
  });
});
