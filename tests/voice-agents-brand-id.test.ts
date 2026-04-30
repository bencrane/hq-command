import { describe, expect, it } from 'vitest';
import { isValidBrandId } from '@/components/voice-agents/use-brand';

describe('isValidBrandId', () => {
  it('accepts a canonical lowercase UUID', () => {
    expect(isValidBrandId('00000000-0000-0000-0000-000000000000')).toBe(true);
    expect(isValidBrandId('a1b2c3d4-e5f6-4789-abcd-0123456789ab')).toBe(true);
  });

  it('accepts uppercase UUIDs (Postgres returns these)', () => {
    expect(isValidBrandId('A1B2C3D4-E5F6-4789-ABCD-0123456789AB')).toBe(true);
  });

  it('tolerates surrounding whitespace from clipboard pastes', () => {
    expect(isValidBrandId('  a1b2c3d4-e5f6-4789-abcd-0123456789ab  ')).toBe(true);
  });

  it('rejects the legacy "Global" string that pinned the page in a 422 loop', () => {
    expect(isValidBrandId('Global')).toBe(false);
  });

  it('rejects empty / whitespace / partial inputs', () => {
    expect(isValidBrandId('')).toBe(false);
    expect(isValidBrandId('   ')).toBe(false);
    expect(isValidBrandId('a1b2c3d4')).toBe(false);
    expect(isValidBrandId('a1b2c3d4-e5f6-4789-abcd-0123456789')).toBe(false);
  });

  it('rejects values with non-hex characters', () => {
    expect(isValidBrandId('zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz')).toBe(false);
    expect(isValidBrandId('a1b2c3d4-e5f6-4789-abcd-0123456789ag')).toBe(false);
  });
});
