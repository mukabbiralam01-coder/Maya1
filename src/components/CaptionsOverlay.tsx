/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { LiveTranscript, VibeConfig } from '../types.ts';

interface CaptionsOverlayProps {
  lastTranscript: LiveTranscript | null;
  vibe: VibeConfig;
  showCaptions: boolean;
}

export const CaptionsOverlay: React.FC<CaptionsOverlayProps> = ({
  lastTranscript,
  vibe,
  showCaptions,
}) => {
  const [visibleText, setVisibleText] = useState<string>('');
  const [role, setRole] = useState<'user' | 'assistant'>('assistant');

  useEffect(() => {
    if (!lastTranscript) return;
    setVisibleText(lastTranscript.text);
    setRole(lastTranscript.role);

    const timer = setTimeout(() => {
      // Gentle fade out after speech stops
      setVisibleText('');
    }, 6000);

    return () => clearTimeout(timer);
  }, [lastTranscript]);

  if (!showCaptions || !visibleText) return null;

  return (
    <div className="absolute top-24 left-1/2 -translate-x-1/2 z-25 w-11/12 max-w-lg pointer-events-none transition-all duration-300">
      <div
        className="px-4 py-2.5 rounded-xl border backdrop-blur-xl bg-black/75 shadow-lg text-center"
        style={{
          borderColor: role === 'assistant' ? `${vibe.primary}44` : 'rgba(255,255,255,0.15)',
        }}
      >
        <span
          className="text-[10px] font-mono uppercase tracking-widest block mb-0.5"
          style={{ color: role === 'assistant' ? vibe.primary : '#94a3b8' }}
        >
          {role === 'assistant' ? 'ZOYA' : 'YOU'}
        </span>
        <p className="text-sm font-medium text-white tracking-wide leading-relaxed font-sans">
          {visibleText}
        </p>
      </div>
    </div>
  );
};
