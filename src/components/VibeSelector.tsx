/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Check } from 'lucide-react';
import { VibeConfig, VibeType } from '../types.ts';
import { VIBE_CONFIGS } from '../utils/vibes.ts';

interface VibeSelectorProps {
  isOpen: boolean;
  activeVibe: VibeConfig;
  onSelectVibe: (vibe: VibeType) => void;
  onClose: () => void;
}

export const VibeSelector: React.FC<VibeSelectorProps> = ({
  isOpen,
  activeVibe,
  onSelectVibe,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="vibe-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-slate-950/95 p-6 shadow-2xl text-white">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h2 id="vibe-modal-title" className="text-base font-bold font-mono tracking-wider uppercase">
              Holographic Vibes
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Change Zoya&apos;s ambient lighting or say &ldquo;Change vibe to...&rdquo;
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {(Object.keys(VIBE_CONFIGS) as VibeType[]).map((key) => {
            const v = VIBE_CONFIGS[key];
            const isSelected = v.id === activeVibe.id;
            return (
              <button
                type="button"
                key={v.id}
                onClick={() => {
                  onSelectVibe(v.id);
                  onClose();
                }}
                className={`relative flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-white bg-white/10 shadow-lg scale-[1.02]'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                }`}
                style={{
                  borderColor: isSelected ? v.primary : undefined,
                  boxShadow: isSelected ? `0 0 15px ${v.primary}44` : undefined,
                }}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <span
                    className="w-4 h-4 rounded-full shadow-sm"
                    style={{ backgroundColor: v.primary }}
                  />
                  {isSelected && <Check className="w-4 h-4 text-white" />}
                </div>
                <span className="text-xs font-semibold text-white tracking-wide">
                  {v.name}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                  {v.tagline}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
