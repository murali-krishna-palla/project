/**
 * Data Access Layer - System Audio Muting Service (Browser Web Audio API)
 * Equivalent to SystemAudioMuter.swift
 */
class AudioMuterService {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.previousVolume = 1.0;
  }

  /**
   * Initialize audio context and master gain node
   */
  initialize(audioContext) {
    if (!audioContext || audioContext.state === 'closed') {
      console.warn('⚠️ Cannot initialize AudioMuter - context is invalid or closed');
      return false;
    }
    this.audioContext = audioContext;
    if (!this.masterGain) {
      try {
        this.masterGain = audioContext.createGain();
        if (audioContext.state !== 'closed') {
          this.masterGain.connect(audioContext.destination);
          console.log('✓ AudioMuter initialized - master gain connected to destination');
        }
      } catch (err) {
        console.warn('Failed to initialize audio muter:', err);
        return false;
      }
    }
    return true;
  }

  /**
   * Mute system audio output (sets gain to 0)
   */
  mute() {
    if (!this.masterGain || !this.audioContext) {
      console.warn('⚠️ Cannot mute - masterGain or audioContext not initialized');
      return false;
    }
    if (this.audioContext.state === 'closed') {
      console.warn('⚠️ Cannot mute - audio context is closed');
      return false;
    }
    try {
      this.previousVolume = this.masterGain.gain.value;
      this.masterGain.gain.setValueAtTime(0, this.audioContext.currentTime);
      console.log('✓ Audio muted (gain set to 0)');
      return true;
    } catch (err) {
      console.warn('Failed to mute audio:', err);
      return false;
    }
  }

  /**
   * Unmute and restore previous volume level
   */
  unmute() {
    if (!this.masterGain || !this.audioContext) return false;
    if (this.audioContext.state === 'closed') return false;
    try {
      this.masterGain.gain.setValueAtTime(this.previousVolume, this.audioContext.currentTime);
      console.log('✓ Audio unmuted');
      return true;
    } catch (err) {
      console.warn('Failed to unmute audio:', err);
      return false;
    }
  }

  /**
   * Set volume level (0 to 1)
   */
  setVolume(level) {
    if (!this.masterGain || !this.audioContext) return false;
    try {
      const clampedLevel = Math.max(0, Math.min(1, level));
      this.masterGain.gain.setValueAtTime(clampedLevel, this.audioContext.currentTime);
      this.previousVolume = clampedLevel;
      return true;
    } catch (err) {
      console.warn('Failed to set volume:', err);
      return false;
    }
  }

  /**
   * Get current volume level
   */
  getVolume() {
    return this.masterGain?.gain.value || 0;
  }
}

const audioMuterService = new AudioMuterService();

export default audioMuterService;
