/**
 * Data Access Layer - Text Injection Service (Browser Clipboard API)
 * Equivalent to TextInjector.swift
 * 
 * Note: Browsers prevent auto-paste for security reasons.
 * Instead, we copy to clipboard and provide UI feedback for user to paste.
 */
class TextInjectorService {
  /**
   * Copy text to clipboard
   * Returns: Promise<boolean> - true if successful
   */
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      console.log('✓ Text copied to clipboard');
      return true;
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      return false;
    }
  }

  /**
   * Copy to clipboard and notify user
   * This is the web equivalent of TextInjector.inject() with user-initiated paste
   */
  async injectText(text, onSuccess, onError) {
    try {
      const success = await this.copyToClipboard(text);
      if (success) {
        if (onSuccess) onSuccess('Text copied to clipboard! Use Ctrl+V (or Cmd+V) to paste.');
      } else {
        if (onError) onError('Failed to copy to clipboard.');
      }
      return success;
    } catch (err) {
      if (onError) onError(err.message);
      return false;
    }
  }

  /**
   * Read from clipboard (requires user permission)
   * Returns: Promise<string> - clipboard text
   */
  async readFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      return text;
    } catch (err) {
      console.error('Failed to read from clipboard:', err);
      return null;
    }
  }

  /**
   * Check if clipboard API is available
   * Returns: boolean
   */
  isAvailable() {
    return !!(navigator && navigator.clipboard);
  }
}

export default new TextInjectorService();
