/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export class AudioRecorder {
  private audioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private onChunkCallback: ((base64Pcm16: string) => void) | null = null;
  private isRunning: boolean = false;
  private currentVolume: number = 0;

  constructor() {}

  public async start(onAudioChunk: (base64Pcm16: string) => void): Promise<void> {
    if (this.isRunning) return;

    this.onChunkCallback = onAudioChunk;

    // Request high-quality microphone stream with echo cancellation
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    // Create AudioContext (try 16000Hz or standard rate)
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    try {
      this.audioCtx = new AudioContextClass({ sampleRate: 16000 });
    } catch (e) {
      this.audioCtx = new AudioContextClass();
    }

    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }

    this.sourceNode = this.audioCtx.createMediaStreamSource(this.mediaStream);

    // Setup AnalyserNode for visualization
    this.analyserNode = this.audioCtx.createAnalyser();
    this.analyserNode.fftSize = 256;
    this.analyserNode.smoothingTimeConstant = 0.5;
    this.sourceNode.connect(this.analyserNode);

    // Setup ScriptProcessor for PCM capture
    const bufferSize = 4096;
    this.processorNode = this.audioCtx.createScriptProcessor(bufferSize, 1, 1);

    this.processorNode.onaudioprocess = (e: AudioProcessingEvent) => {
      if (!this.isRunning) return;

      const inputData = e.inputBuffer.getChannelData(0);

      // Compute RMS volume
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) {
        sum += inputData[i] * inputData[i];
      }
      const rms = Math.sqrt(sum / inputData.length);
      this.currentVolume = Math.min(1, rms * 5); // boosted for sensitivity

      // Resample to 16,000 Hz if necessary
      const sampleRate = this.audioCtx?.sampleRate || 16000;
      const resampledData = this.resampleTo16k(inputData, sampleRate);

      // Convert to 16-bit PCM little-endian
      const pcm16 = this.floatTo16BitPCM(resampledData);

      // Convert buffer to base64
      const base64 = this.arrayBufferToBase64(pcm16.buffer);

      if (this.onChunkCallback) {
        this.onChunkCallback(base64);
      }
    };

    this.sourceNode.connect(this.processorNode);
    this.processorNode.connect(this.audioCtx.destination);

    this.isRunning = true;
  }

  public stop(): void {
    this.isRunning = false;
    this.currentVolume = 0;

    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.analyserNode) {
      this.analyserNode.disconnect();
      this.analyserNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
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

  public getVolume(): number {
    return this.isRunning ? this.currentVolume : 0;
  }

  public getFrequencyData(outputArray: Uint8Array): void {
    if (this.analyserNode && this.isRunning) {
      this.analyserNode.getByteFrequencyData(outputArray as any);
    } else {
      outputArray.fill(0);
    }
  }

  public isRecordingActive(): boolean {
    return this.isRunning;
  }

  private resampleTo16k(input: Float32Array, inputRate: number): Float32Array {
    if (inputRate === 16000) return input;
    const ratio = inputRate / 16000;
    const newLength = Math.round(input.length / ratio);
    const result = new Float32Array(newLength);
    for (let i = 0; i < newLength; i++) {
      const origPos = i * ratio;
      const i0 = Math.floor(origPos);
      const i1 = Math.min(i0 + 1, input.length - 1);
      const t = origPos - i0;
      result[i] = input[i0] * (1 - t) + input[i1] * t;
    }
    return result;
  }

  private floatTo16BitPCM(input: Float32Array): Int16Array {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return output;
  }

  private arrayBufferToBase64(buffer: ArrayBufferLike): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}
