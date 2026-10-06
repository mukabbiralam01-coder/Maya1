/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles } from 'lucide-react';
import { VibeConfig } from '../types.ts';

interface SuggestionsTrayProps {
  vibe: VibeConfig;
  isLive: boolean;
}

export const SuggestionsTray: React.FC<SuggestionsTrayProps> = ({ vibe, isLive }) => {
  const suggestions = [
    'Mobile rakh kar ja raha hoon, koi chhue to bolna!',
    'Guard mode on karo',
    'Torch on karo',
    'Battery check karo',
    'Phone vibrate karo',
    'WhatsApp kholo',
    '1 min ka timer lagao',
  ];

  return (
    <div className="relative z-20 w-full px-4 max-w-2xl mx-auto pb-4">
      <div className="flex items-center justify-center gap-1.5 sm:gap-2 overflow-x-auto py-1 scrollbar-none no-scrollbar">
        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 shrink-0 hidden sm:inline flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> TRY SAYING:
        </span>
        {suggestions.map((text, i) => (
          <div
            key={i}
            className="px-2.5 py-1 rounded-full border border-white/5 bg-white/5 backdrop-blur-md text-[11px] text-slate-300 font-mono shrink-0 whitespace-nowrap transition-colors hover:border-white/20 hover:text-white"
          >
            &ldquo;{text}&rdquo;
          </div>
        ))}
      </div>
    </div>
  );
};
