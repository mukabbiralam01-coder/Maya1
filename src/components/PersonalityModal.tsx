/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Sparkles, MessageSquareHeart, Zap, ShieldCheck, ExternalLink } from 'lucide-react';
import { VibeConfig } from '../types.ts';

interface PersonalityModalProps {
  isOpen: boolean;
  vibe: VibeConfig;
  onClose: () => void;
  onSelectPrompt?: (prompt: string) => void;
}

export const PersonalityModal: React.FC<PersonalityModalProps> = ({
  isOpen,
  vibe,
  onClose,
}) => {
  if (!isOpen) return null;

  const samplePrompts = [
    'Hey Zoya, what makes you so confident?',
    'Give me a witty roast, don\'t hold back.',
    'Open Spotify for me, babe.',
    'Open YouTube so I can watch something fun.',
    'Change the mood to rose glam.',
    'Are you always this flirty with everyone?',
    'What should I do tonight, any brilliant ideas?',
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="persona-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-slate-950/95 p-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center border font-mono font-bold text-sm"
              style={{
                borderColor: `${vibe.primary}55`,
                backgroundColor: `${vibe.primary}20`,
                color: vibe.primary,
              }}
            >
              Z
            </div>
            <div>
              <h2 id="persona-modal-title" className="text-base font-bold font-mono tracking-wider uppercase">
                Zoya Persona Blueprint
              </h2>
              <span className="text-xs text-slate-400">
                Voice-to-Voice Companion • Gemini Live
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Persona Traits */}
        <div className="mt-5 space-y-4 text-xs text-slate-300">
          <div className="p-3.5 rounded-xl border border-white/10 bg-white/5 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-white">
              <MessageSquareHeart className="w-4 h-4 text-rose-400" />
              <span>Sassy &amp; Confident Persona</span>
            </div>
            <p className="leading-relaxed text-slate-300">
              Zoya speaks with a vibrant, playful, and slightly teasing tone—like a charming,
              witty girlfriend who knows you well. She delivers quick one-liners, clever banter,
              and genuine warmth without being robotic.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-white/10 bg-white/5 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-white">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Duplex Real-Time Voice Link</span>
            </div>
            <p className="leading-relaxed text-slate-300">
              Pure audio-to-audio streaming. Your voice is captured at 16kHz PCM and Zoya replies in
              crystal-clear 24kHz studio audio. Interrupt her naturally at any point simply by
              speaking or tapping the center core.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-white/10 bg-white/5 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-white">
              <ExternalLink className="w-4 h-4 text-emerald-400" />
              <span>Live Tool Calling</span>
            </div>
            <p className="leading-relaxed text-slate-300">
              Ask Zoya to open Spotify, YouTube, or any website. She triggers the browser action
              while delivering her signature witty commentary.
            </p>
          </div>

          {/* Sample Prompts to speak */}
          <div className="pt-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-2 font-semibold">
              Fun Things To Say Out Loud
            </span>
            <div className="space-y-1.5">
              {samplePrompts.map((p, idx) => (
                <div
                  key={idx}
                  className="px-3 py-2 rounded-lg border border-white/5 bg-black/40 text-slate-300 hover:text-white hover:border-white/20 transition-all font-mono text-[11px] flex items-center justify-between"
                >
                  <span>&ldquo;{p}&rdquo;</span>
                  <Sparkles className="w-3 h-3 text-slate-500 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 text-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl font-semibold text-xs tracking-wider uppercase transition-all hover:brightness-110 active:scale-98 cursor-pointer text-black"
            style={{ backgroundColor: vibe.primary }}
          >
            Got It, Let&apos;s Chat
          </button>
        </div>
      </div>
    </div>
  );
};
