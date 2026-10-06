/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export class AudioStreamer {
  private audioCtx: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private nextStartTime: number = 0;
  private activeSources: Set<AudioBufferSourceNode> = new Set();
  private isMuted: boolean = false;
  private volumeLevel: number = 1.0;
  private onStateChange: ((isPlaying: boolean) => void) | null = null;
  private checkInterval: any = null;

  constructor(onStateChange?: (isPlaying: boolean) => void) {
    this.onStateChange = onStateChange || null;
  }

  private initContext(): AudioContext {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      try {
        this.audioCtx = new AudioContextClass({ sampleRate: 24000 });
      } catch (e) {
        this.audioCtx = new AudioContextClass();
      }

      this.analyserNode = this.audioCtx.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.analyserNode.smoothingTimeConstant = 0.4;

      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.value = this.isMuted ? 0 : this.volumeLevel;

      this.analyserNode.connect(this.gainNode);
      this.gainNode.connect(this.audioCtx.destination);
    }
    return this.audioCtx;
  }

  public async resume(): Promise<void> {
    const ctx = this.initContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
  }

  public playChunk(base64Pcm24: string): void {
    const ctx = this.initContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Decode base64 to 16-bit PCM little-endian
    const binary = atob(base64Pcm24);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const int16Array = new Int16Array(bytes.buffer);
    if (int16Array.length === 0) return;

    // Create AudioBuffer at 24000 Hz
    const audioBuffer = ctx.createBuffer(1, int16Array.length, 24000);
    const channelData = audioBuffer.getChannelData(0);

    // Normalize Int16 to Float32 [-1.0, 1.0]
    for (let i = 0; i < int16Array.length; i++) {
      channelData[i] = int16Array[i] / 32768.0;
    }

    // Create BufferSourceNode
    const sourceNode = ctx.createBufferSource();
    sourceNode.buffer = audioBuffer;

    if (this.analyserNode) {
      sourceNode.connect(this.analyserNode);
    }

    // Precise gapless scheduling with jitter buffer
    const now = ctx.currentTime;
    if (this.nextStartTime < now) {
      // Small buffer offset of 30ms to prevent buffer underrun clicks
      this.nextStartTime = now + 0.03;
    }

    sourceNode.start(this.nextStartTime);
    this.nextStartTime += audioBuffer.duration;

    this.activeSources.add(sourceNode);

    sourceNode.onended = () => {
      this.activeSources.delete(sourceNode);
      try {
        sourceNode.disconnect();
      } catch (e) {
        // ignore
      }
      this.checkPlaybackState();
    };

    this.checkPlaybackState();
  }

  public stopAll(): void {
    // Immediate cancellation of all currently playing and queued chunks
    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {
        // ignore
      }
    }
    this.activeSources.clear();
    this.nextStartTime = 0;
    this.checkPlaybackState();
  }

  public isPlaying(): boolean {
    if (!this.audioCtx) return false;
    return this.activeSources.size > 0 || (this.audioCtx.currentTime < this.nextStartTime);
  }

  public getVolume(): number {
    if (!this.analyserNode || !this.isPlaying()) return 0;
    const data = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    return Math.min(1, (sum / (data.length * 255)) * 2.5);
  }

  public getFrequencyData(outputArray: Uint8Array): void {
    if (this.analyserNode && this.isPlaying()) {
      this.analyserNode.getByteFrequencyData(outputArray as any);
    } else {
      outputArray.fill(0);
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.gainNode) {
      this.gainNode.gain.value = muted ? 0 : this.volumeLevel;
    }
  }

  public setVolume(vol: number): void {
    this.volumeLevel = Math.max(0, Math.min(1, vol));
    if (this.gainNode && !this.isMuted) {
      this.gainNode.gain.value = this.volumeLevel;
    }
  }

  private checkPlaybackState(): void {
    const playing = this.isPlaying();
    if (this.onStateChange) {
      this.onStateChange(playing);
    }
  }

  public destroy(): void {
    this.stopAll();
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try {
        this.audioCtx.close();
      } catch (e) {
        // ignore
      }
      this.audioCtx = null;
    }
  }
}
