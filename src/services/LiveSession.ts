/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AudioRecorder } from './AudioRecorder.ts';
import { AudioStreamer } from './AudioStreamer.ts';
import { AssistantState, ToolCallData, LiveTranscript, VoiceOption } from '../types.ts';

export interface LiveSessionCallbacks {
  onStateChange: (state: AssistantState) => void;
  onToolCall: (toolCall: ToolCallData) => void;
  onTranscript: (transcript: LiveTranscript) => void;
  onError: (error: string) => void;
  onVoiceReady?: (model: string, voice: string) => void;
}

export class LiveSession {
  private ws: WebSocket | null = null;
  private recorder: AudioRecorder;
  private streamer: AudioStreamer;
  private state: AssistantState = 'disconnected';
  private callbacks: LiveSessionCallbacks;
  private currentVoice: VoiceOption = 'Aoede';
  private volumeInterval: any = null;
  private userSpeakingThreshold: number = 0.08;
  private consecutiveUserSpeechFrames: number = 0;
  private isExplicitDisconnect: boolean = false;

  constructor(callbacks: LiveSessionCallbacks) {
    this.callbacks = callbacks;
    this.recorder = new AudioRecorder();
    this.streamer = new AudioStreamer((isPlaying) => {
      if (this.state === 'disconnected' || this.state === 'connecting') return;
      if (isPlaying) {
        this.setState('speaking');
      } else {
        // If not playing and mic is active, we are listening/idle
        this.setState('listening');
      }
    });
  }

  public getState(): AssistantState {
    return this.state;
  }

  public getRecorder(): AudioRecorder {
    return this.recorder;
  }

  public getStreamer(): AudioStreamer {
    return this.streamer;
  }

  private setState(newState: AssistantState): void {
    if (this.state === newState) return;
    this.state = newState;
    this.callbacks.onStateChange(newState);
  }

  public async connect(voice: VoiceOption = 'Aoede'): Promise<void> {
    if (this.state !== 'disconnected' && this.state !== 'error') {
      return;
    }

    this.isExplicitDisconnect = false;
    this.currentVoice = voice;
    this.setState('connecting');

    try {
      // 1. Resume / initialize output audio context first (required on mobile gestures)
      await this.streamer.resume();

      // 2. Establish WebSocket connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live-ws`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = async () => {
        console.log('[LiveSession] WebSocket connected');
        // Start capturing microphone input
        try {
          await this.recorder.start((base64Chunk) => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
              this.ws.send(
                JSON.stringify({
                  type: 'audio',
                  data: base64Chunk,
                })
              );
            }

            // Check if user is speaking over Zoya to trigger local interruption
            this.handleLocalVoiceActivity();
          });

          this.setState('listening');
          this.startVolumeMonitoring();
        } catch (micErr: any) {
          console.error('[LiveSession] Microphone access error:', micErr);
          this.callbacks.onError('Microphone permission required for voice interaction.');
          this.disconnect();
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'audio' && msg.data) {
            // Feed 24kHz audio chunk into streamer
            this.streamer.playChunk(msg.data);
          } else if (msg.type === 'interrupted') {
            // Server detected model interruption
            console.log('[LiveSession] Model interrupted');
            this.streamer.stopAll();
            this.setState('interrupted');
            setTimeout(() => {
              if (this.state === 'interrupted') {
                this.setState('listening');
              }
            }, 300);
          } else if (msg.type === 'tool_call') {
            // Function call received
            const toolCall: ToolCallData = {
              id: msg.id || `${Date.now()}`,
              name: msg.name,
              args: msg.args || {},
              timestamp: Date.now(),
            };
            this.callbacks.onToolCall(toolCall);
          } else if (msg.type === 'transcript') {
            this.callbacks.onTranscript({
              id: `${Date.now()}-${Math.random()}`,
              role: msg.role,
              text: msg.text,
              timestamp: Date.now(),
            });
          } else if (msg.type === 'ready') {
            console.log('[LiveSession] Ready with', msg.model, msg.voice);
            if (this.callbacks.onVoiceReady) {
              this.callbacks.onVoiceReady(msg.model, msg.voice);
            }
          } else if (msg.type === 'error') {
            console.error('[LiveSession] Server error:', msg.message);
            this.callbacks.onError(msg.message);
          }
        } catch (e) {
          console.error('[LiveSession] Error handling WS message:', e);
        }
      };

      this.ws.onclose = () => {
        console.log('[LiveSession] WebSocket closed, explicit:', this.isExplicitDisconnect);
        if (this.isExplicitDisconnect) {
          this.disconnect();
        } else if (this.state !== 'disconnected') {
          // Unexpected drop - automatically reconnect to maintain continuous session
          console.log('[LiveSession] Unexpected connection drop, attempting auto-reconnect...');
          this.setState('connecting');
          setTimeout(() => {
            if (!this.isExplicitDisconnect && this.state !== 'disconnected') {
              this.connect(this.currentVoice).catch((err) => {
                console.error('[LiveSession] Auto-reconnect failed:', err);
                this.disconnect();
              });
            }
          }, 1200);
        }
      };

      this.ws.onerror = (e) => {
        console.error('[LiveSession] WebSocket error:', e);
        this.callbacks.onError('Connection error to voice server.');
        this.disconnect();
      };
    } catch (err: any) {
      console.error('[LiveSession] Connect failed:', err);
      this.callbacks.onError(err?.message || 'Failed to initialize session');
      this.disconnect();
    }
  }

  public interrupt(): void {
    // User taps mic/button to interrupt Zoya speaking
    if (this.streamer.isPlaying()) {
      this.streamer.stopAll();
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'interrupt' }));
      }
      this.setState('listening');
    }
  }

  public changeVoice(voice: VoiceOption): void {
    this.currentVoice = voice;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'voice_change',
          voice,
        })
      );
    }
  }

  private handleLocalVoiceActivity(): void {
    const userVol = this.recorder.getVolume();
    if (userVol > this.userSpeakingThreshold) {
      this.consecutiveUserSpeechFrames++;
      // If user has been speaking for multiple consecutive frames and Zoya is currently speaking:
      if (this.consecutiveUserSpeechFrames > 3 && this.streamer.isPlaying()) {
        console.log('[LiveSession] Local user speech interruption detected');
        this.streamer.stopAll();
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'interrupt' }));
        }
        this.setState('listening');
      }
    } else {
      this.consecutiveUserSpeechFrames = 0;
    }
  }

  private startVolumeMonitoring(): void {
    if (this.volumeInterval) clearInterval(this.volumeInterval);
    this.volumeInterval = setInterval(() => {
      if (this.state === 'disconnected') return;
      // Background monitoring if needed
    }, 100);
  }

  public disconnect(): void {
    this.isExplicitDisconnect = true;
    if (this.volumeInterval) {
      clearInterval(this.volumeInterval);
      this.volumeInterval = null;
    }

    this.recorder.stop();
    this.streamer.stopAll();

    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {
        // ignore
      }
      this.ws = null;
    }

    this.setState('disconnected');
  }

  public destroy(): void {
    this.disconnect();
    this.streamer.destroy();
  }
}
