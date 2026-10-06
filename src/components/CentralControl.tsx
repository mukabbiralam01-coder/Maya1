/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Mic, MicOff, Power, Volume2, Sparkles, Loader2, StopCircle } from 'lucide-react';
import { AssistantState, VibeConfig } from '../types.ts';

interface CentralControlProps {
  state: AssistantState;
  vibe: VibeConfig;
  onToggle: () => void;
  onInterrupt: () => void;
}

export const CentralControl: React.FC<CentralControlProps> = ({
  state,
  vibe,
  onToggle,
  onInterrupt,
}) => {
  const isDisconnected = state === 'disconnected' || state === 'error';
  const isConnecting = state === 'connecting';
  const isListening = state === 'listening' || state === 'idle';
  const isSpeaking = state === 'speaking';
  const isInterrupted = state === 'interrupted';

  const handleClick = () => {
    if (isSpeaking) {
      onInterrupt();
    } else {
      onToggle();
    }
  };

  return (
    <div className="relative z-20 flex flex-col items-center justify-center">
      {/* State label badge */}
      <div className="mb-4 flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-black/60 backdrop-blur-md text-xs font-mono tracking-widest uppercase transition-all duration-300">
        {isDisconnected && (
          <>
            <span className="w-2 h-2 rounded-full bg-slate-500 animate-pulse" />
            <span className="text-slate-400">SESSION OFFLINE</span>
          </>
        )}
        {isConnecting && (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            <span className="text-cyan-300">LINKING 24kHZ GEMINI LIVE</span>
          </>
        )}
        {isListening && (
          <>
            <span className="relative flex h-2 w-2">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ backgroundColor: vibe.primary }}
              />
              <span
                className="relative inline-flex rounded-full h-2 w-2"
                style={{ backgroundColor: vibe.primary }}
              />
            </span>
            <span className="text-white font-medium">ZOYA LISTENING</span>
          </>
        )}
        {isSpeaking && (
          <>
            <Volume2 className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span className="text-white font-semibold">ZOYA SPEAKING • TAP TO INTERRUPT</span>
          </>
        )}
        {isInterrupted && (
          <>
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-amber-300">INTERRUPTED</span>
          </>
        )}
      </div>

      {/* Main Interactive Button */}
      <div className="relative group">
        {/* Outer ambient glow pulse */}
        <div
          className={`absolute -inset-3 rounded-full blur-xl opacity-75 transition-all duration-500 pointer-events-none ${
            isDisconnected
              ? 'bg-slate-800/30'
              : isSpeaking
              ? 'opacity-100 scale-110'
              : 'opacity-80 animate-pulse'
          }`}
          style={{
            backgroundColor: isDisconnected ? 'transparent' : vibe.primary,
          }}
        />

        <button
          type="button"
          onClick={handleClick}
          className={`relative flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full border backdrop-blur-xl transition-all duration-300 cursor-pointer shadow-2xl active:scale-95 focus:outline-none focus:ring-4 ${
            isDisconnected
              ? 'bg-slate-900/80 border-slate-700/60 text-slate-300 hover:text-white hover:border-slate-500 hover:bg-slate-800 focus:ring-slate-700'
              : isSpeaking
              ? 'bg-black/80 border-rose-500 text-rose-400 hover:bg-rose-950/40 focus:ring-rose-500/50'
              : 'bg-black/80 text-white hover:brightness-125'
          }`}
          style={{
            borderColor: !isDisconnected && !isSpeaking ? vibe.primary : undefined,
            boxShadow:
              !isDisconnected
                ? `0 0 35px ${isSpeaking ? '#f43f5e88' : vibe.primary + '66'}, inset 0 0 15px ${vibe.primary + '33'}`
                : undefined,
          }}
          aria-label={
            isDisconnected
              ? 'Start Zoya Voice Assistant'
              : isSpeaking
              ? 'Interrupt Zoya'
              : 'Voice session active'
          }
        >
          {isDisconnected && <Power className="w-8 h-8 sm:w-9 sm:h-9 text-slate-300 group-hover:text-white transition-transform group-hover:scale-110" />}
          {isConnecting && <Loader2 className="w-8 h-8 sm:w-9 sm:h-9 text-cyan-400 animate-spin" />}
          {isListening && (
            <div className="flex flex-col items-center">
              <Mic className="w-8 h-8 sm:w-9 sm:h-9 transition-transform group-hover:scale-110" style={{ color: vibe.primary }} />
            </div>
          )}
          {isSpeaking && (
            <div className="flex flex-col items-center">
              <StopCircle className="w-8 h-8 sm:w-9 sm:h-9 text-rose-400 animate-pulse" />
            </div>
          )}
        </button>

        {/* Small disconnect sub-button when active */}
        {!isDisconnected && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            title="End Session"
            className="absolute -bottom-2 -right-2 p-2 rounded-full bg-slate-900/90 border border-slate-700/80 text-slate-400 hover:text-red-400 hover:border-red-500/50 transition-colors cursor-pointer shadow-lg active:scale-90"
          >
            <Power className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Instructional Subtext */}
      <div className="mt-4 text-center">
        <p className="text-xs text-slate-400 font-sans tracking-wide">
          {isDisconnected && 'Tap to awaken Zoya (Voice-to-Voice)'}
          {isConnecting && 'Connecting to Gemini Live WebSocket...'}
          {isListening && 'Speak normally • Zoya will reply instantly'}
          {isSpeaking && 'Tap center button or speak to interrupt'}
        </p>
      </div>
    </div>
  );
};
