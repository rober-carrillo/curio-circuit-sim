// SPDX-License-Identifier: MIT
// Web Audio API implementation for buzzer simulation

/**
 * BuzzerAudioController manages Web Audio API for buzzer sound generation
 * 
 * Arduino's tone() function uses Timer2 to generate PWM at specific frequencies.
 * We extract the frequency from Timer2 registers and play it using Web Audio API.
 */
export class BuzzerAudioController {
  private audioContext: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private currentFrequency: number = 0;
  private isPlaying: boolean = false;

  constructor() {
    // Initialize audio context (must be created in user gesture for browsers)
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 0.1; // 10% volume (buzzers are loud!)
      this.gainNode.connect(this.audioContext.destination);
      console.log('[BUZZER AUDIO] Audio context initialized');
    } catch (e) {
      console.error('[BUZZER AUDIO] Failed to initialize audio context:', e);
    }
  }

  /**
   * Start playing a tone at the specified frequency
   */
  playTone(frequency: number) {
    if (!this.audioContext || !this.gainNode) {
      console.warn('[BUZZER AUDIO] Audio context not initialized');
      return;
    }

    // Resume audio context if suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(e => {
        console.error('[BUZZER AUDIO] Failed to resume audio context:', e);
      });
    }

    // If frequency changed or not playing, restart oscillator
    if (frequency !== this.currentFrequency || !this.isPlaying) {
      this.stopTone();

      try {
        this.oscillator = this.audioContext.createOscillator();
        this.oscillator.type = 'square'; // Square wave for buzzer sound
        this.oscillator.frequency.value = frequency;
        this.oscillator.connect(this.gainNode);
        this.oscillator.start();
        
        this.currentFrequency = frequency;
        this.isPlaying = true;
        
        console.log(`[BUZZER AUDIO] Playing tone at ${frequency}Hz`);
      } catch (e) {
        console.error('[BUZZER AUDIO] Failed to play tone:', e);
      }
    }
  }

  /**
   * Stop playing the current tone
   */
  stopTone() {
    if (this.oscillator && this.isPlaying) {
      try {
        this.oscillator.stop();
        this.oscillator.disconnect();
        this.oscillator = null;
        this.isPlaying = false;
        this.currentFrequency = 0;
        console.log('[BUZZER AUDIO] Stopped tone');
      } catch (e) {
        // Oscillator might already be stopped
        console.warn('[BUZZER AUDIO] Error stopping tone:', e);
      }
    }
  }

  /**
   * Extract frequency from Arduino Timer2 configuration
   * This is how tone() works on Arduino Uno (ATmega328P)
   */
  getFrequencyFromTimer2(cpu: any): number {
    // Timer2 registers (8-bit timer used by tone())
    // TCCR2A (0xB0): Timer/Counter Control Register A
    // TCCR2B (0xB1): Timer/Counter Control Register B
    // OCR2A (0xB3): Output Compare Register A
    // TCNT2 (0xB2): Timer/Counter Register
    
    const TCCR2A = cpu.data[0xB0];
    const TCCR2B = cpu.data[0xB1];
    const OCR2A = cpu.data[0xB3];

    // Check if Timer2 is in CTC mode (Clear Timer on Compare Match)
    // tone() uses CTC mode with OCR2A as the top value
    const wgm = ((TCCR2B & 0x08) >> 1) | (TCCR2A & 0x03);
    if (wgm !== 0x02) {
      // Not in CTC mode, timer not configured for tone()
      return 0;
    }

    // Get prescaler from TCCR2B (bits 2:0)
    const cs = TCCR2B & 0x07;
    const prescalerMap: Record<number, number> = {
      0: 0,    // No clock source (timer stopped)
      1: 1,    // No prescaling
      2: 8,    // clk/8
      3: 32,   // clk/32
      4: 64,   // clk/64
      5: 128,  // clk/128
      6: 256,  // clk/256
      7: 1024, // clk/1024
    };
    const prescaler = prescalerMap[cs] || 0;

    if (prescaler === 0 || OCR2A === 0) {
      // Timer stopped or invalid configuration
      return 0;
    }

    // Arduino Uno CPU frequency: 16 MHz
    const F_CPU = 16000000;
    
    // Frequency formula for CTC mode:
    // f = F_CPU / (2 * prescaler * (OCR2A + 1))
    const frequency = F_CPU / (2 * prescaler * (OCR2A + 1));
    
    return Math.round(frequency);
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  setVolume(volume: number) {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Cleanup audio resources
   */
  cleanup() {
    this.stopTone();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}


