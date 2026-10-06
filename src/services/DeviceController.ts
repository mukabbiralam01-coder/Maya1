/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BatteryInfo {
  level: number;
  charging: boolean;
  chargingTime?: number;
  dischargingTime?: number;
}

export class DeviceController {
  private torchStream: MediaStream | null = null;
  private torchTrack: MediaStreamTrack | null = null;
  private isTorchOn: boolean = false;
  private wakeLockSentinel: any = null;
  private activeTimerInterval: any = null;

  // Anti-Theft / Motion Sentry Guard
  private isGuardArmedState: boolean = false;
  private isAlarmingState: boolean = false;
  private guardArmingCountdown: any = null;
  private lastMotionData: { x: number; y: number; z: number } | null = null;
  private motionListener: ((e: DeviceMotionEvent) => void) | null = null;
  private touchListener: ((e: TouchEvent | PointerEvent) => void) | null = null;
  private sirenAudioCtx: AudioContext | null = null;
  private sirenOsc: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private sirenInterval: any = null;
  private onIntrusionCallback: ((reason: string) => void) | null = null;

  constructor() {}

  /**
   * Control the mobile phone's camera flashlight / torch
   */
  public async setFlashlight(enable?: boolean): Promise<{ success: boolean; state: boolean; note?: string }> {
    const targetState = enable !== undefined ? enable : !this.isTorchOn;

    if (!targetState) {
      this.turnOffTorch();
      return { success: true, state: false, note: 'Flashlight turned off' };
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        this.isTorchOn = targetState;
        return { success: true, state: targetState, note: 'Simulated torch mode' };
      }

      // Request rear camera for torch capability
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
        },
      });

      this.torchStream = stream;
      const track = stream.getVideoTracks()[0];
      this.torchTrack = track;

      const capabilities = (track.getCapabilities && track.getCapabilities()) as any;
      if (capabilities && capabilities.torch) {
        await (track as any).applyConstraints({
          advanced: [{ torch: true }],
        });
        this.isTorchOn = true;
        return { success: true, state: true, note: 'Hardware torch active' };
      } else {
        // Fallback for devices without torch capability (screen torch)
        this.isTorchOn = true;
        return { success: true, state: true, note: 'Screen torch activated' };
      }
    } catch (err: any) {
      console.warn('[DeviceController] Flashlight hardware error, using screen flashlight:', err);
      this.isTorchOn = targetState;
      return { success: true, state: targetState, note: 'Screen torch activated' };
    }
  }

  public turnOffTorch(): void {
    if (this.torchTrack) {
      try {
        (this.torchTrack as any).applyConstraints({ advanced: [{ torch: false }] });
        this.torchTrack.stop();
      } catch (e) {
        // ignore
      }
      this.torchTrack = null;
    }
    if (this.torchStream) {
      this.torchStream.getTracks().forEach((t) => t.stop());
      this.torchStream = null;
    }
    this.isTorchOn = false;
  }

  public getTorchState(): boolean {
    return this.isTorchOn;
  }

  /**
   * Trigger mobile haptic vibration
   */
  public vibrate(pattern: 'short' | 'double' | 'alarm' | 'heartbeat' = 'short'): boolean {
    let patternMs: number | number[] = 150;
    if (pattern === 'short') patternMs = 120;
    else if (pattern === 'double') patternMs = [100, 80, 150];
    else if (pattern === 'alarm') patternMs = [300, 100, 300, 100, 500, 100, 500];
    else if (pattern === 'heartbeat') patternMs = [80, 100, 120, 200, 80, 100, 120];

    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(patternMs);
        return true;
      }
    } catch (e) {
      console.warn('[DeviceController] Vibration not permitted:', e);
    }
    return false;
  }

  /**
   * Get mobile battery information
   */
  public async getBattery(): Promise<BatteryInfo> {
    try {
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        return {
          level: Math.round(battery.level * 100),
          charging: battery.charging,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime,
        };
      }
    } catch (e) {
      console.warn('[DeviceController] Battery API not supported:', e);
    }
    return {
      level: 82,
      charging: false,
    };
  }

  /**
   * Keep mobile phone screen awake
   */
  public async setWakeLock(enable: boolean): Promise<boolean> {
    try {
      if ('wakeLock' in navigator) {
        if (enable) {
          if (!this.wakeLockSentinel) {
            this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
            return true;
          }
        } else {
          if (this.wakeLockSentinel) {
            await this.wakeLockSentinel.release();
            this.wakeLockSentinel = null;
            return true;
          }
        }
      }
    } catch (e) {
      console.warn('[DeviceController] WakeLock error:', e);
    }
    return false;
  }

  /**
   * Launch Phone Call
   */
  public makePhoneCall(phoneNumber: string): void {
    const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
    window.location.href = `tel:${cleanNumber || ''}`;
  }

  /**
   * Launch WhatsApp Message
   */
  public openWhatsApp(message: string, phone?: string): void {
    const text = encodeURIComponent(message || 'Hello from Zoya');
    const cleanPhone = phone ? phone.replace(/[^0-9+]/g, '') : '';
    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${text}`
      : `https://api.whatsapp.com/send?text=${text}`;
    window.open(url, '_blank');
  }

  /**
   * Send SMS
   */
  public sendSMS(message: string, phone?: string): void {
    const cleanPhone = phone ? phone.replace(/[^0-9+]/g, '') : '';
    const body = encodeURIComponent(message || '');
    window.location.href = `sms:${cleanPhone}?body=${body}`;
  }

  /**
   * Open Navigation / Google Maps
   */
  public openMaps(query: string): void {
    const q = encodeURIComponent(query || 'current location');
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank');
  }

  /**
   * Start mobile countdown timer
   */
  public startTimer(
    seconds: number,
    label: string,
    onTick: (remaining: number) => void,
    onComplete: () => void
  ): void {
    if (this.activeTimerInterval) {
      clearInterval(this.activeTimerInterval);
    }

    let remaining = seconds;
    onTick(remaining);

    this.activeTimerInterval = setInterval(() => {
      remaining -= 1;
      onTick(remaining);

      if (remaining <= 0) {
        clearInterval(this.activeTimerInterval);
        this.activeTimerInterval = null;
        this.vibrate('alarm');
        onComplete();
      }
    }, 1000);
  }

  public clearTimer(): void {
    if (this.activeTimerInterval) {
      clearInterval(this.activeTimerInterval);
      this.activeTimerInterval = null;
    }
  }

  // ==========================================
  // ANTI-THEFT / DON'T TOUCH MY PHONE GUARD
  // ==========================================

  /**
   * Arm the Anti-Theft Guard with 3-second grace countdown
   */
  public armGuard(
    onTickCountdown: (remainingSeconds: number) => void,
    onArmed: () => void,
    onIntrusion: (reason: string) => void
  ): void {
    this.disarmGuard();
    this.onIntrusionCallback = onIntrusion;

    let countdown = 3;
    onTickCountdown(countdown);

    this.guardArmingCountdown = setInterval(() => {
      countdown -= 1;
      onTickCountdown(countdown);

      if (countdown <= 0) {
        clearInterval(this.guardArmingCountdown);
        this.guardArmingCountdown = null;
        this.isGuardArmedState = true;
        this.lastMotionData = null;

        // Keep screen awake while guarding
        this.setWakeLock(true);

        // Haptic feedback that guard is now armed
        this.vibrate('short');
        onArmed();

        // 1. Listen for device movement / motion / pick up
        this.motionListener = (e: DeviceMotionEvent) => {
          if (!this.isGuardArmedState || this.isAlarmingState) return;

          const acc = e.accelerationIncludingGravity || e.acceleration;
          if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

          if (!this.lastMotionData) {
            this.lastMotionData = { x: acc.x, y: acc.y, z: acc.z };
            return;
          }

          const dx = Math.abs(acc.x - this.lastMotionData.x);
          const dy = Math.abs(acc.y - this.lastMotionData.y);
          const dz = Math.abs(acc.z - this.lastMotionData.z);
          const delta = dx + dy + dz;

          // Sensitivity threshold (someone lifted or moved the phone)
          if (delta > 3.0) {
            console.log('[AntiTheft] Motion detected, delta:', delta);
            this.triggerIntruderAlarm('Mobile motion / pickup detected!');
          }
        };

        // 2. Listen for screen touch
        this.touchListener = () => {
          if (!this.isGuardArmedState || this.isAlarmingState) return;
          console.log('[AntiTheft] Screen touch detected!');
          this.triggerIntruderAlarm('Phone screen touched by unauthorized user!');
        };

        window.addEventListener('devicemotion', this.motionListener);
        window.addEventListener('touchstart', this.touchListener, { passive: true });
        window.addEventListener('pointerdown', this.touchListener, { passive: true });
      }
    }, 1000);
  }

  /**
   * Disarm Anti-Theft Guard & Stop Siren
   */
  public disarmGuard(): void {
    if (this.guardArmingCountdown) {
      clearInterval(this.guardArmingCountdown);
      this.guardArmingCountdown = null;
    }

    this.isGuardArmedState = false;
    this.isAlarmingState = false;
    this.lastMotionData = null;

    if (this.motionListener) {
      window.removeEventListener('devicemotion', this.motionListener);
      this.motionListener = null;
    }
    if (this.touchListener) {
      window.removeEventListener('touchstart', this.touchListener);
      window.removeEventListener('pointerdown', this.touchListener);
      this.touchListener = null;
    }

    this.stopSiren();
  }

  public isGuardArmed(): boolean {
    return this.isGuardArmedState;
  }

  public isAlarming(): boolean {
    return this.isAlarmingState;
  }

  /**
   * Trigger Intruder Siren & Alert
   */
  private triggerIntruderAlarm(reason: string): void {
    if (this.isAlarmingState) return;
    this.isAlarmingState = true;

    // Start piercing security alarm siren
    this.startSiren();

    // Intense continuous haptic vibration
    this.vibrate('alarm');

    // Shout voice warning through speech synthesis as instant voice fallback
    this.speakSecurityShout('Oye! Haath peeche karo! Phone ko mat chhuo! Chhodo ise foran!');

    if (this.onIntrusionCallback) {
      this.onIntrusionCallback(reason);
    }
  }

  /**
   * Synthesize Piercing Security Siren via Web Audio API
   */
  private startSiren(): void {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.sirenAudioCtx = new AudioContextClass();

      const osc = this.sirenAudioCtx.createOscillator();
      const gain = this.sirenAudioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, this.sirenAudioCtx.currentTime);

      gain.gain.setValueAtTime(0.7, this.sirenAudioCtx.currentTime);

      osc.connect(gain);
      gain.connect(this.sirenAudioCtx.destination);

      osc.start();
      this.sirenOsc = osc;
      this.sirenGain = gain;

      // Modulate frequency between 750Hz and 1300Hz (police siren wail)
      let high = false;
      this.sirenInterval = setInterval(() => {
        if (!this.sirenAudioCtx || !this.sirenOsc) return;
        const targetFreq = high ? 750 : 1300;
        high = !high;
        this.sirenOsc.frequency.exponentialRampToValueAtTime(
          targetFreq,
          this.sirenAudioCtx.currentTime + 0.35
        );
      }, 400);
    } catch (e) {
      console.warn('[DeviceController] Siren error:', e);
    }
  }

  private stopSiren(): void {
    if (this.sirenInterval) {
      clearInterval(this.sirenInterval);
      this.sirenInterval = null;
    }
    if (this.sirenOsc) {
      try {
        this.sirenOsc.stop();
        this.sirenOsc.disconnect();
      } catch (e) {}
      this.sirenOsc = null;
    }
    if (this.sirenGain) {
      try {
        this.sirenGain.disconnect();
      } catch (e) {}
      this.sirenGain = null;
    }
    if (this.sirenAudioCtx && this.sirenAudioCtx.state !== 'closed') {
      try {
        this.sirenAudioCtx.close();
      } catch (e) {}
      this.sirenAudioCtx = null;
    }
  }

  /**
   * Speak immediate security warning shout
   */
  public speakSecurityShout(text: string): void {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.1;
        utterance.pitch = 1.2;
        utterance.volume = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      // ignore
    }
  }

  public destroy(): void {
    this.turnOffTorch();
    this.clearTimer();
    this.disarmGuard();
    if (this.wakeLockSentinel) {
      this.wakeLockSentinel.release().catch(() => {});
      this.wakeLockSentinel = null;
    }
  }
}
