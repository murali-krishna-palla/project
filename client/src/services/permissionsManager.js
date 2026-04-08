/**
 * Data Access Layer - Browser Permissions Manager Service
 * Equivalent to PermissionsManager.swift for web browsers
 */
class PermissionsManager {
  /**
   * Request microphone permission
   * Returns: Promise<boolean> - true if granted
   */
  async requestMicrophonePermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately, we just needed permission
      stream.getTracks().forEach(track => track.stop());
      console.log('✓ Microphone permission granted');
      return true;
    } catch (err) {
      console.error('Microphone permission denied:', err);
      return false;
    }
  }

  /**
   * Check microphone permission status
   * Returns: Promise<'granted'|'denied'|'unknown'>
   */
  async checkMicrophonePermission() {
    try {
      const permission = await navigator.permissions.query({ name: 'microphone' });
      return permission.state; // 'granted', 'denied', or 'prompt'
    } catch (err) {
      return 'unknown';
    }
  }

  /**
   * Request clipboard permission
   * Returns: Promise<boolean> - true if available
   */
  async checkClipboardPermission() {
    try {
      const permission = await navigator.permissions.query({ name: 'clipboard-write' });
      return permission.state === 'granted';
    } catch (err) {
      // Fallback if Permissions API not available
      return !!navigator.clipboard;
    }
  }

  /**
   * Check all required permissions
   * Returns: Promise<{microphone: boolean, clipboard: boolean}>
   */
  async checkAllPermissions() {
    const [micStatus, clipboardStatus] = await Promise.all([
      this.checkMicrophonePermission(),
      this.checkClipboardPermission()
    ]);

    return {
      microphone: micStatus === 'granted',
      clipboard: clipboardStatus === 'granted',
      clipboardPrompt: clipboardStatus === 'prompt'
    };
  }

  /**
   * Request all necessary permissions
   * Returns: Promise<{success: boolean, granted: {microphone, clipboard}}>
   */
  async requestAllPermissions() {
    const micGranted = await this.requestMicrophonePermission();
    const clipboardAvailable = await this.checkClipboardPermission();

    return {
      success: micGranted,
      granted: {
        microphone: micGranted,
        clipboard: clipboardAvailable
      }
    };
  }

  /**
   * Show browser notification about permissions
   */
  showPermissionAlert(title, message) {
    // In browser, we can show alerts or notifications
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: message });
    } else {
      alert(`${title}\n\n${message}`);
    }
  }
}

export default new PermissionsManager();
