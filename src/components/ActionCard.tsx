/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  ExternalLink,
  Sparkles,
  X,
  Globe,
  Flame,
  Music,
  CheckCircle2,
  Flashlight,
  Vibrate,
  BatteryCharging,
  Battery,
  Eye,
  PhoneCall,
  MessageCircle,
  Timer,
  MapPin,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { HologramWidget, VibeConfig } from '../types.ts';

interface ActionCardProps {
  widget: HologramWidget | null;
  vibe: VibeConfig;
  onDismiss: () => void;
  onActionClick?: (type: string, data?: any) => void;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  widget,
  vibe,
  onDismiss,
  onActionClick,
}) => {
  const [didAutoOpen, setDidAutoOpen] = useState(false);

  useEffect(() => {
    if (!widget) {
      setDidAutoOpen(false);
      return;
    }

    if (widget.type === 'open_website' && widget.url) {
      try {
        const opened = window.open(widget.url, '_blank');
        if (opened) {
          setDidAutoOpen(true);
        }
      } catch (e) {
        console.warn('Popup blocked by browser:', e);
      }
    }
  }, [widget]);

  if (!widget) return null;

  return (
    <aside
      aria-label="Interactive Holographic Action HUD"
      className="fixed bottom-32 sm:bottom-28 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-auto font-sans"
    >
      <div
        className="relative overflow-hidden rounded-2xl border p-4 sm:p-5 backdrop-blur-2xl bg-black/85 shadow-2xl transition-all"
        style={{
          borderColor: `${vibe.primary}66`,
          boxShadow: `0 0 30px ${vibe.primary}33`,
        }}
      >
        {/* Ambient Top Glow Bar */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{
            background: `linear-gradient(90deg, transparent, ${vibe.primary}, ${vibe.secondary}, transparent)`,
          }}
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl border shrink-0"
            style={{
              borderColor: `${vibe.primary}44`,
              backgroundColor: `${vibe.primary}20`,
              color: vibe.primary,
            }}
          >
            {widget.type === 'open_website' && <Globe className="w-5 h-5" />}
            {widget.type === 'flashlight' && (
              <Flashlight
                className={`w-5 h-5 ${widget.isTorchOn ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`}
              />
            )}
            {widget.type === 'vibration' && <Vibrate className="w-5 h-5 text-rose-400 animate-bounce" />}
            {widget.type === 'battery' && (
              widget.isCharging ? (
                <BatteryCharging className="w-5 h-5 text-emerald-400" />
              ) : (
                <Battery className="w-5 h-5 text-cyan-400" />
              )
            )}
            {widget.type === 'wake_lock' && <Eye className="w-5 h-5 text-cyan-400" />}
            {widget.type === 'call' && <PhoneCall className="w-5 h-5 text-emerald-400" />}
            {widget.type === 'whatsapp' && <MessageCircle className="w-5 h-5 text-emerald-400" />}
            {widget.type === 'maps' && <MapPin className="w-5 h-5 text-rose-400" />}
            {widget.type === 'timer' && <Timer className="w-5 h-5 text-amber-400 animate-spin" />}
            {widget.type === 'anti_theft_guard' && <ShieldCheck className="w-5 h-5 text-emerald-400 animate-pulse" />}
            {widget.type === 'intruder_alert' && <ShieldAlert className="w-5 h-5 text-red-500 animate-bounce" />}
            {widget.type === 'witty_roast' && <Flame className="w-5 h-5 text-amber-400" />}
            {widget.type === 'vibe_change' && <Sparkles className="w-5 h-5" />}
            {widget.type === 'flirty_note' && <Sparkles className="w-5 h-5 text-rose-400" />}
            {widget.type === 'music_card' && <Music className="w-5 h-5" />}
          </div>

          <div className="flex-1 pr-6">
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-mono uppercase tracking-wider font-semibold"
                style={{ color: vibe.primary }}
              >
                PHONE CONTROL EXECUTED
              </span>
              {didAutoOpen && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                  <CheckCircle2 className="w-3 h-3" />
                  OPENED
                </span>
              )}
            </div>
            <h2 className="text-sm font-bold text-white tracking-wide mt-0.5">
              {widget.title}
            </h2>
            <p className="text-xs text-slate-300 mt-1 italic leading-relaxed font-sans">
              &ldquo;{widget.content}&rdquo;
            </p>
          </div>
        </div>

        {/* Action Button for specific mobile tools */}
        {widget.url && (
          <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between gap-3">
            <span className="text-[11px] font-mono text-slate-400 truncate max-w-[200px]">
              {widget.url}
            </span>
            <a
              href={widget.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-black transition-all hover:brightness-110 active:scale-95 shrink-0"
              style={{
                backgroundColor: vibe.primary,
              }}
            >
              <span>{didAutoOpen ? 'Open Again' : 'Launch Site'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {widget.type === 'call' && widget.target && (
          <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between gap-3">
            <span className="text-xs font-mono text-slate-300">
              {widget.target}
            </span>
            <a
              href={`tel:${widget.target.replace(/[^0-9+]/g, '')}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shrink-0"
            >
              <PhoneCall className="w-3.5 h-3.5" /> Call Now
            </a>
          </div>
        )}

        {widget.type === 'whatsapp' && (
          <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-300 truncate max-w-[200px]">
              {widget.message || 'WhatsApp message'}
            </span>
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(widget.message || '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-black bg-emerald-400 hover:bg-emerald-300 transition-all shrink-0"
            >
              <MessageCircle className="w-3.5 h-3.5" /> Open WhatsApp
            </a>
          </div>
        )}

        {widget.type === 'intruder_alert' && (
          <div className="mt-3.5 pt-3 border-t border-red-500/30 flex items-center justify-between gap-3">
            <span className="text-xs text-red-400 font-mono font-bold animate-pulse">
              INTRUDER ALARM!
            </span>
            {onActionClick && (
              <button
                type="button"
                onClick={() => onActionClick('disarm_guard')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition-all cursor-pointer shadow-lg shadow-red-500/50"
              >
                <ShieldAlert className="w-3.5 h-3.5" /> Turn Off Alarm
              </button>
            )}
          </div>
        )}

        {widget.type === 'anti_theft_guard' && (
          <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between gap-3">
            <span className="text-xs text-emerald-400 font-mono font-semibold">
              Motion Guard Armed
            </span>
            {onActionClick && (
              <button
                type="button"
                onClick={() => onActionClick('disarm_guard')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
              >
                Disarm Guard
              </button>
            )}
          </div>
        )}

        {widget.type === 'flashlight' && (
          <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-300 font-mono">
              Status: {widget.isTorchOn ? 'LIGHT ON' : 'LIGHT OFF'}
            </span>
            {onActionClick && (
              <button
                type="button"
                onClick={() => onActionClick('toggle_torch')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-black bg-amber-400 hover:bg-amber-300 transition-all cursor-pointer"
              >
                <Flashlight className="w-3.5 h-3.5" /> Toggle Flashlight
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
