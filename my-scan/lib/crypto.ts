// lib/crypto.ts
// AES-256-CBC encryption/decryption for sensitive token storage

import crypto from 'crypto';
import { env } from './env';
import { logger } from './logger';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

/**
 * Get the encryption key from environment
 * Throws error if key is missing or invalid (security requirement)
 */
function getEncryptionKey(): Buffer {
  const key = env.ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error('ENCRYPTION_KEY is required but not set. Please set a 32-character encryption key in .env');
  }
  
  if (key.length !== 32) {
    throw new Error(`ENCRYPTION_KEY must be exactly 32 characters, got ${key.length}`);
  }
  
  return Buffer.from(key, 'utf-8');
}

/**
 * Encrypts a plaintext string using AES-256-CBC
 * Returns format: iv:encryptedData (hex encoded)
 */
export function encrypt(text: string): string {
  if (!text) return '';
  
  try {
    const keyBuffer = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);
    
    let encrypted = cipher.update(text, 'utf-8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
  } catch (error) {
    logger.error('Encryption failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    throw error;
  }
}

/**
 * Decrypts an encrypted string back to plaintext
 * Expects format: iv:encryptedData (hex encoded)
 */
export function decrypt(text: string): string {
  if (!text) return '';
  
  try {
    const [ivHex, encryptedHex] = text.split(':');
    
    if (!ivHex || !encryptedHex) {
      throw new Error('Invalid encrypted text format');
    }
    
    const keyBuffer = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedText = Buffer.from(encryptedHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf-8');
  } catch (error) {
    logger.error('Decryption failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    return '';
  }
}

/**
 * Validates that encryption is properly configured
 * Useful for startup health checks
 */
export function validateEncryptionSetup(): boolean {
  try {
    getEncryptionKey();
    
    // Test round-trip encryption
    const testValue = 'encryption-test-' + Date.now();
    const encrypted = encrypt(testValue);
    const decrypted = decrypt(encrypted);
    
    return decrypted === testValue;
  } catch (error) {
    logger.error('Encryption validation failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    return false;
  }
}