/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Sparkles,
  Palette,
  Volume2,
  Subtitles,
  Info,
  Radio,
  SlidersHorizontal,
  ChevronDown,
  Smartphone,
  Flashlight,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { AssistantState, VibeConfig, VoiceOption } from '../types.ts';

interface TopHudProps {
  state: AssistantState;
  vibe: VibeConfig;
  currentVoice: VoiceOption;
  onChangeVoice: (voice: VoiceOption) => void;
  onOpenVibePicker: () => void;
  onOpenInfo: () => void;
  onOpenMobileControls: () => void;
  showCaptions: boolean;
  onToggleCaptions: () => void;
  isTorchOn?: boolean;
  isGuardArmed?: boolean;
  isGuardAlarming?: boolean;
}

export const TopHud: React.FC<TopHudProps> = ({
  state,
  vibe,
  currentVoice,
  onChangeVoice,
  onOpenVibePicker,
  onOpenInfo,
  onOpenMobileControls,
  showCaptions,
  onToggleCaptions,
  isTorchOn = false,
  isGuardArmed = false,
  isGuardAlarming = false,
}) => {
  const isLive = state === 'listening' || state === 'speaking' || state === 'idle';

  return (
    <header className="relative z-30 w-full px-4 sm:px-6 py-3 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-xl">
      {/* Left: Brand & Status */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-xl border border-white/10 bg-white/5 overflow-hidden shadow-inner">
          <span
            className="text-lg font-black tracking-tighter"
            style={{ color: vibe.primary }}
          >
            Z
          </span>
          {isLive && (
            <div
              className="absolute -bottom-1 w-full h-1 blur-xs animate-pulse"
              style={{ backgroundColor: vibe.primary }}
            />
          )}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-widest uppercase text-white font-mono">
              ZOYA AI
            </h1>
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase border"
              style={{
                color: vibe.primary,
                borderColor: `${vibe.primary}44`,
                backgroundColor: `${vibe.primary}15`,
              }}
            >
              LIVE 3.1
            </span>
            {isGuardAlarming ? (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border border-red-500 bg-red-950/80 text-red-400 animate-bounce">
                <ShieldAlert className="w-3 h-3" />
                SIREN
              </span>
            ) : isGuardArmed ? (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border border-emerald-500/50 bg-emerald-950/60 text-emerald-400 animate-pulse">
                <ShieldCheck className="w-3 h-3" />
                GUARDED
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
            <Radio
              className={`w-3 h-3 ${
                isLive ? 'animate-pulse text-emerald-400' : 'text-slate-500'
              }`}
            />
            <span>{isLive ? '16kHz / 24kHz DUPLEX' : 'VOICE ENGINE READY'}</span>
          </div>
        </div>
      </div>

      {/* Right: Quick Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Voice persona toggle */}
        <div className="relative group">
          <button
            type="button"
            onClick={() => onChangeVoice(currentVoice === 'Aoede' ? 'Kore' : 'Aoede')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-mono text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Switch Voice Persona"
          >
            <Volume2 className="w-3.5 h-3.5" style={{ color: vibe.primary }} />
            <span className="hidden sm:inline">Voice:</span>
            <span className="font-semibold text-white">{currentVoice}</span>
            <span className="text-[10px] text-slate-400">
              ({currentVoice === 'Aoede' ? 'Sassy' : 'Calm'})
            </span>
          </button>
        </div>

        {/* Vibe theme picker */}
        <button
          type="button"
          onClick={onOpenVibePicker}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-mono text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Change Holographic Vibe"
        >
          <span
            className="w-2.5 h-2.5 rounded-full shadow-xs"
            style={{ backgroundColor: vibe.primary }}
          />
          <span className="hidden md:inline">{vibe.name}</span>
          <Palette className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {/* Captions toggle */}
        <button
          type="button"
          onClick={onToggleCaptions}
          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
            showCaptions
              ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300'
              : 'border-white/10 bg-white/5 text-slate-400 hover:text-slate-200'
          }`}
          title={showCaptions ? 'Captions Enabled' : 'Captions Muted'}
          aria-label="Toggle live voice captions"
        >
          <Subtitles className="w-4 h-4" />
        </button>

        {/* Mobile Control Hub */}
        <button
          type="button"
          onClick={onOpenMobileControls}
          className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border transition-all cursor-pointer ${
            isTorchOn
              ? 'border-amber-400 bg-amber-400/20 text-amber-300 shadow-md shadow-amber-500/20'
              : 'border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
          }`}
          title="Mobile Phone Controls (Torch, Battery, Haptics)"
          aria-label="Mobile Controls"
        >
          {isTorchOn ? (
            <Flashlight className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          ) : (
            <Smartphone className="w-3.5 h-3.5" style={{ color: vibe.primary }} />
          )}
          <span className="hidden sm:inline text-xs font-mono font-medium">Phone</span>
        </button>

        {/* Persona Info button */}
        <button
          type="button"
          onClick={onOpenInfo}
          className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Zoya Personality & Voice Prompts"
          aria-label="About Zoya"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
