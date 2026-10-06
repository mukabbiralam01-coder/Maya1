/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AssistantState =
  | 'disconnected'
  | 'connecting'
  | 'idle'
  | 'listening'
  | 'speaking'
  | 'interrupted'
  | 'error';

export type VibeType =
  | 'cyber_neon'
  | 'rose_glam'
  | 'midnight_purple'
  | 'emerald_matrix'
  | 'sunset_blaze'
  | 'crimson_pulse';

export interface VibeConfig {
  id: VibeType;
  name: string;
  tagline: string;
  primary: string; // e.g. '#06b6d4'
  secondary: string; // e.g. '#3b82f6'
  glow: string; // rgba
  bgGradient: string;
  accentClass: string;
}

export interface ToolCallData {
  id: string;
  name: string;
  args: Record<string, any>;
  timestamp: number;
}

export interface HologramWidget {
  id: string;
  type:
    | 'open_website'
    | 'vibe_change'
    | 'witty_roast'
    | 'flirty_note'
    | 'music_card'
    | 'quote'
    | 'reminder'
    | 'flashlight'
    | 'vibration'
    | 'battery'
    | 'wake_lock'
    | 'call'
    | 'whatsapp'
    | 'sms'
    | 'maps'
    | 'timer'
    | 'anti_theft_guard'
    | 'intruder_alert';
  title: string;
  content: string;
  url?: string;
  siteName?: string;
  actionReason?: string;
  target?: string;
  message?: string;
  seconds?: number;
  batteryLevel?: number;
  isCharging?: boolean;
  isTorchOn?: boolean;
  timestamp: number;
}

export interface LiveTranscript {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

export type VoiceOption = 'Aoede' | 'Kore';
