// lib/__tests__/crypto.test.ts
// Unit tests for encryption/decryption module

// Mock environment before importing crypto module
jest.mock('@/lib/env', () => ({
  env: {
    ENCRYPTION_KEY: '12345678901234567890123456789012', // 32 chars - must be inline due to hoisting
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

import { encrypt, decrypt, validateEncryptionSetup } from '../crypto';

describe('Crypto Module', () => {
  describe('encrypt', () => {
    it('should return empty string for empty input', () => {
      expect(encrypt('')).toBe('');
    });

    it('should return empty string for null/undefined', () => {
      expect(encrypt(null as any)).toBe('');
      expect(encrypt(undefined as any)).toBe('');
    });

    it('should encrypt a string and return hex format with IV', () => {
      const result = encrypt('test-secret');
      
      // Should be in format iv:encrypted (both hex)
      expect(result).toContain(':');
      
      const [iv, encrypted] = result.split(':');
      expect(iv).toHaveLength(32); // 16 bytes = 32 hex chars
      expect(encrypted.length).toBeGreaterThan(0);
    });

    it('should produce different outputs for same input (random IV)', () => {
      const input = 'same-input';
      const result1 = encrypt(input);
      const result2 = encrypt(input);
      
      // Different because of random IV
      expect(result1).not.toBe(result2);
    });
  });

  describe('decrypt', () => {
    it('should return empty string for empty input', () => {
      expect(decrypt('')).toBe('');
    });

    it('should return empty string for null/undefined', () => {
      expect(decrypt(null as any)).toBe('');
      expect(decrypt(undefined as any)).toBe('');
    });

    it('should decrypt an encrypted string back to original', () => {
      const original = 'my-secret-token-12345';
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(original);
    });

    it('should handle special characters', () => {
      const original = 'token!@#$%^&*()_+-=[]{}|;:,.<>?';
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(original);
    });

    it('should handle unicode characters', () => {
      const original = 'รหัสลับ-токен-密码';
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(original);
    });

    it('should return empty string for invalid encrypted format', () => {
      expect(decrypt('invalid-data')).toBe('');
      expect(decrypt('not:valid:hex')).toBe('');
    });
  });

  describe('validateEncryptionSetup', () => {
    it('should return true when encryption is properly configured', () => {
      expect(validateEncryptionSetup()).toBe(true);
    });
  });

  describe('round-trip encryption', () => {
    const testCases = [
      'simple-token',
      'ghp_1234567890abcdef',
      'dckr_pat_abcdefghij',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0',
      'a'.repeat(1000), // Long string
    ];

    testCases.forEach((testCase) => {
      it(`should handle: ${testCase.substring(0, 30)}...`, () => {
        const encrypted = encrypt(testCase);
        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(testCase);
      });
    });
  });
});
