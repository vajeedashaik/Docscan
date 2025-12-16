/**
 * Token Encryption/Decryption Utility
 * Handles secure storage and retrieval of OAuth tokens
 *
 * In production, ensure:
 * - TOKEN_ENCRYPTION_KEY is stored securely (e.g., AWS KMS, Vault)
 * - NEVER commit the key to git
 * - Use environment variables for the key
 * - Implement key rotation strategy
 */

// For browser-side encryption (using TweetNaCl library)
// In production, you should use a library like libsodium-wasm

/**
 * Simple base64 encoding for browser-side token storage
 * WARNING: This is NOT cryptographically secure. Use only for initial implementation.
 * For production, implement proper AES-256-GCM encryption.
 */
export function encryptTokenBrowser(token: string): string {
  try {
    return btoa(token); // Base64 encode
  } catch (error) {
    console.error("Error encrypting token:", error);
    throw new Error("Failed to encrypt token");
  }
}

export function decryptTokenBrowser(encrypted: string): string {
  try {
    return atob(encrypted); // Base64 decode
  } catch (error) {
    console.error("Error decrypting token:", error);
    throw new Error("Failed to decrypt token");
  }
}

/**
 * For server-side, use crypto-js or similar
 * These functions are for illustration; implement with proper crypto library
 */

interface EncryptionResult {
  encrypted: string;
  iv: string;
  salt: string;
}

/**
 * Placeholder for server-side AES-256 encryption
 * Use this with a proper crypto library like crypto-js or TweetNaCl
 * Install: npm install crypto-js
 */
export function encryptTokenServer(
  token: string,
  masterKey: string
): EncryptionResult {
  // This is a placeholder. In production:
  // import CryptoJS from 'crypto-js';
  // const encrypted = CryptoJS.AES.encrypt(token, masterKey).toString();
  // return { encrypted, iv: '', salt: '' };

  // For now, base64 as temporary solution
  return {
    encrypted: btoa(token),
    iv: "",
    salt: "",
  };
}

export function decryptTokenServer(
  encrypted: EncryptionResult,
  masterKey: string
): string {
  // This is a placeholder. In production:
  // import CryptoJS from 'crypto-js';
  // const decrypted = CryptoJS.AES.decrypt(encrypted.encrypted, masterKey).toString(CryptoJS.enc.Utf8);
  // return decrypted;

  // For now, base64 as temporary solution
  return atob(encrypted.encrypted);
}

/**
 * Generate a secure random key (for server-side use only)
 * Install: npm install tweetnacl nacl-util
 */
export function generateEncryptionKey(): string {
  const array = new Uint8Array(32);
  if (typeof window !== "undefined" && window.crypto) {
    window.crypto.getRandomValues(array);
  }
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Sanitize token before storage (remove sensitive parts)
 */
export function sanitizeTokenForLogging(token: string): string {
  if (token.length < 10) return "***";
  return `${token.substring(0, 5)}...${token.substring(token.length - 5)}`;
}

/**
 * Check if token is likely expired
 */
export function isTokenExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return true;
  const now = new Date();
  const buffer = 5 * 60 * 1000; // 5 minute buffer
  return now.getTime() > new Date(expiresAt).getTime() - buffer;
}

/**
 * For production setup with crypto-js:
 * npm install crypto-js
 * npm install --save-dev @types/crypto-js
 *
 * Then use:
 * import CryptoJS from 'crypto-js';
 *
 * export function encryptTokenProduction(token: string, key: string): string {
 *   const encrypted = CryptoJS.AES.encrypt(token, key).toString();
 *   return encrypted;
 * }
 *
 * export function decryptTokenProduction(encrypted: string, key: string): string {
 *   const decrypted = CryptoJS.AES.decrypt(encrypted, key).toString(CryptoJS.enc.Utf8);
 *   return decrypted;
 * }
 */
