const CryptoJS = require('crypto-js');
const logger = require('./logger');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default_key_change_in_production';

/**
 * Encrypts sensitive data (API keys)
 * @param {string} data - Data to encrypt
 * @returns {string} - Encrypted data in Base64
 */
const encryptData = (data) => {
  try {
    if (!data) return '';
    
    const encrypted = CryptoJS.AES.encrypt(
      data.toString(),
      ENCRYPTION_KEY
    );
    
    return encrypted.toString();
  } catch (error) {
    logger.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypts sensitive data (API keys)
 * Falls back to returning plaintext if decryption fails (for backward compatibility)
 * @param {string} encryptedData - Encrypted data or plaintext
 * @returns {string} - Decrypted or plaintext data
 */
const decryptData = (encryptedData) => {
  try {
    if (!encryptedData) return '';
    
    // Try to decrypt
    const decrypted = CryptoJS.AES.decrypt(
      encryptedData,
      ENCRYPTION_KEY
    );
    
    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
    
    // If decryption produced valid UTF-8 string, use it
    if (decryptedString && decryptedString.length > 0) {
      return decryptedString;
    }
    
    // Decryption failed - assume plaintext (for backward compatibility)
    logger.warn('Decryption produced empty result, assuming plaintext data');
    return encryptedData;
  } catch (error) {
    // Decryption failed - assume plaintext (for backward compatibility with unencrypted data)
    logger.warn('Decryption failed, assuming plaintext data:', error.message);
    return encryptedData;
  }
};

module.exports = {
  encryptData,
  decryptData
};
