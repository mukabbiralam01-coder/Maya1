/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldAlert, Volume2, BellRing, CheckCircle2 } from 'lucide-react';

interface IntruderAlertModalProps {
  isOpen: boolean;
  warningMessage: string;
  onDisarm: () => void;
}

export const IntruderAlertModal: React.FC<IntruderAlertModalProps> = ({
  isOpen,
  warningMessage,
  onDisarm,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label="Intruder Motion Alarm Triggered"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-red-950/95 backdrop-blur-2xl text-white font-sans animate-pulse"
    >
      {/* Background Strobe Flash */}
      <div className="absolute inset-0 bg-red-600/30 animate-ping pointer-events-none" />

      {/* Warning Icon Badge */}
      <div className="relative flex items-center justify-center w-28 h-28 rounded-full border-4 border-red-500 bg-red-900/80 shadow-[0_0_80px_rgba(239,68,68,0.8)] mb-6 animate-bounce">
        <ShieldAlert className="w-16 h-16 text-white" />
      </div>

      <div className="text-center max-w-md relative z-10 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/50 border border-red-400 text-xs font-mono tracking-widest uppercase font-bold text-red-200">
          <BellRing className="w-4 h-4 animate-spin" />
          MOTION &amp; TOUCH INTRUDER ALERT
        </div>

        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase drop-shadow-md">
          PHONE TOUCH DETECTED!
        </h1>

        <div className="p-4 rounded-2xl bg-black/60 border border-red-500/40 shadow-inner">
          <span className="text-xs font-mono uppercase text-red-400 block mb-1 font-semibold flex items-center justify-center gap-1.5">
            <Volume2 className="w-4 h-4" /> ZOYA SECURITY SHOUT:
          </span>
          <p className="text-base sm:text-lg font-bold text-white italic leading-relaxed">
            &ldquo;{warningMessage}&rdquo;
          </p>
        </div>

        <p className="text-xs text-red-200 font-mono tracking-wide pt-2">
          Security siren blaring • Phone vibrating • Intruder reported
        </p>
      </div>

      {/* Disarm Button for Owner */}
      <div className="mt-8 relative z-10 w-full max-w-xs">
        <button
          type="button"
          onClick={onDisarm}
          className="w-full py-4 rounded-2xl bg-white hover:bg-slate-100 text-red-600 font-black text-sm uppercase tracking-wider shadow-2xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          Main Malik Hoon (Disarm Siren)
        </button>
      </div>
    </div>
  );
};
