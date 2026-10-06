/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Flashlight,
  Vibrate,
  Battery,
  BatteryCharging,
  Eye,
  EyeOff,
  PhoneCall,
  MessageCircle,
  Timer,
  Play,
  CheckCircle2,
  Sparkles,
  Smartphone,
  ShieldAlert,
  ShieldCheck,
  Bell,
  Volume2,
} from 'lucide-react';
import { VibeConfig } from '../types.ts';
import { DeviceController, BatteryInfo } from '../services/DeviceController.ts';

interface MobileControlDrawerProps {
  isOpen: boolean;
  vibe: VibeConfig;
  deviceController: DeviceController;
  isTorchOn: boolean;
  isWakeLockOn: boolean;
  isGuardArmed: boolean;
  isGuardAlarming: boolean;
  guardCountdown: number | null;
  onToggleTorch: () => void;
  onToggleWakeLock: () => void;
  onArmGuard: () => void;
  onDisarmGuard: () => void;
  onClose: () => void;
}

export const MobileControlDrawer: React.FC<MobileControlDrawerProps> = ({
  isOpen,
  vibe,
  deviceController,
  isTorchOn,
  isWakeLockOn,
  isGuardArmed,
  isGuardAlarming,
  guardCountdown,
  onToggleTorch,
  onToggleWakeLock,
  onArmGuard,
  onDisarmGuard,
  onClose,
}) => {
  const [battery, setBattery] = useState<BatteryInfo>({ level: 85, charging: false });
  const [timerInput, setTimerInput] = useState<number>(60);
  const [activeTimerSeconds, setActiveTimerSeconds] = useState<number | null>(null);
  const [phoneInput, setPhoneInput] = useState<string>('');
  const [whatsappMsg, setWhatsappMsg] = useState<string>('');
  const [vibrateFeedback, setVibrateFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      deviceController.getBattery().then(setBattery);
    }
  }, [isOpen, deviceController]);

  if (!isOpen) return null;

  const handleVibrate = (pattern: 'short' | 'double' | 'heartbeat') => {
    deviceController.vibrate(pattern);
    setVibrateFeedback(`Vibrated (${pattern})`);
    setTimeout(() => setVibrateFeedback(null), 1500);
  };

  const handleStartTimer = () => {
    deviceController.startTimer(
      timerInput,
      'Zoya Mobile Timer',
      (remaining) => setActiveTimerSeconds(remaining),
      () => {
        setActiveTimerSeconds(null);
      }
    );
  };

  const handleStopTimer = () => {
    deviceController.clearTimer();
    setActiveTimerSeconds(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-ctrl-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 font-sans"
    >
      <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-slate-950/95 p-6 shadow-2xl text-white max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center border font-mono font-bold text-sm"
              style={{
                borderColor: `${vibe.primary}55`,
                backgroundColor: `${vibe.primary}20`,
                color: vibe.primary,
              }}
            >
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 id="mobile-ctrl-title" className="text-base font-bold font-mono tracking-wider uppercase">
                Mobile Control Hub
              </h2>
              <span className="text-xs text-slate-400">
                Direct Phone Hardware &amp; App Controls
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

        {/* Live Grid of Phone Hardware Controls */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          {/* 1. Flashlight / Torch */}
          <button
            type="button"
            onClick={onToggleTorch}
            className={`flex flex-col items-start p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
              isTorchOn
                ? 'border-amber-400 bg-amber-500/20 shadow-lg shadow-amber-500/20'
                : 'border-white/10 bg-white/5 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <Flashlight
                className={`w-6 h-6 ${isTorchOn ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`}
              />
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                  isTorchOn ? 'bg-amber-400 text-black' : 'bg-white/10 text-slate-400'
                }`}
              >
                {isTorchOn ? 'ON' : 'OFF'}
              </span>
            </div>
            <span className="text-xs font-bold text-white tracking-wide">Flashlight / Torch</span>
            <span className="text-[10px] text-slate-400 mt-0.5">
              Say: &ldquo;Torch on/off karo&rdquo;
            </span>
          </button>

          {/* 2. Battery Status */}
          <div className="flex flex-col items-start p-3.5 rounded-2xl border border-white/10 bg-white/5 text-left">
            <div className="flex items-center justify-between w-full mb-2">
              {battery.charging ? (
                <BatteryCharging className="w-6 h-6 text-emerald-400 animate-pulse" />
              ) : (
                <Battery className="w-6 h-6 text-cyan-400" />
              )}
              <span className="text-[11px] font-mono font-bold text-white">
                {battery.level}%
              </span>
            </div>
            <span className="text-xs font-bold text-white tracking-wide">
              Phone Battery
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">
              {battery.charging ? 'Charging now' : 'On battery power'}
            </span>
          </div>

          {/* 3. Screen Wake Lock */}
          <button
            type="button"
            onClick={onToggleWakeLock}
            className={`flex flex-col items-start p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
              isWakeLockOn
                ? 'border-cyan-400 bg-cyan-500/20 shadow-lg shadow-cyan-500/20'
                : 'border-white/10 bg-white/5 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-2">
              {isWakeLockOn ? (
                <Eye className="w-6 h-6 text-cyan-400" />
              ) : (
                <EyeOff className="w-6 h-6 text-slate-400" />
              )}
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                  isWakeLockOn ? 'bg-cyan-400 text-black' : 'bg-white/10 text-slate-400'
                }`}
              >
                {isWakeLockOn ? 'ACTIVE' : 'IDLE'}
              </span>
            </div>
            <span className="text-xs font-bold text-white tracking-wide">Screen Awake</span>
            <span className="text-[10px] text-slate-400 mt-0.5">
              Prevent screen sleep
            </span>
          </button>

          {/* 4. Vibration / Haptics */}
          <div className="flex flex-col items-start p-3.5 rounded-2xl border border-white/10 bg-white/5 text-left">
            <div className="flex items-center justify-between w-full mb-2">
              <Vibrate className="w-6 h-6 text-rose-400" />
              {vibrateFeedback && (
                <span className="text-[10px] font-mono text-emerald-400 font-semibold animate-pulse">
                  Buzz!
                </span>
              )}
            </div>
            <span className="text-xs font-bold text-white tracking-wide">Haptic Buzz</span>
            <div className="flex gap-1.5 mt-1.5 w-full">
              <button
                type="button"
                onClick={() => handleVibrate('short')}
                className="flex-1 py-1 px-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-mono font-medium text-slate-300 text-center cursor-pointer"
              >
                Short
              </button>
              <button
                type="button"
                onClick={() => handleVibrate('double')}
                className="flex-1 py-1 px-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-mono font-medium text-slate-300 text-center cursor-pointer"
              >
                Double
              </button>
              <button
                type="button"
                onClick={() => handleVibrate('heartbeat')}
                className="flex-1 py-1 px-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-mono font-medium text-slate-300 text-center cursor-pointer"
              >
                Heart
              </button>
            </div>
          </div>
        </div>

        {/* Anti-Theft Sentry Guard ("Don't Touch My Phone") */}
        <div
          className={`mt-4 p-4 rounded-2xl border transition-all ${
            isGuardAlarming
              ? 'border-red-500 bg-red-950/60 shadow-xl shadow-red-500/30 animate-pulse'
              : isGuardArmed
              ? 'border-emerald-500 bg-emerald-950/40 shadow-lg shadow-emerald-500/20'
              : 'border-white/10 bg-white/5'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {isGuardAlarming ? (
                <ShieldAlert className="w-5 h-5 text-red-500 animate-bounce" />
              ) : isGuardArmed ? (
                <ShieldCheck className="w-5 h-5 text-emerald-400 animate-pulse" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-amber-400" />
              )}
              <div>
                <span className="text-xs font-bold text-white block">
                  Don&apos;t Touch My Phone (Pehredar Guard)
                </span>
                <span className="text-[10px] text-slate-400">
                  {isGuardAlarming
                    ? 'INTRUDER DETECTED! SIREN ACTIVE!'
                    : isGuardArmed
                    ? 'Armed: If anyone moves/touches phone, siren rings!'
                    : guardCountdown !== null
                    ? `Arming in ${guardCountdown}s (Keep phone down)...`
                    : 'Place phone down and arm guard'}
                </span>
              </div>
            </div>

            {isGuardAlarming ? (
              <button
                type="button"
                onClick={onDisarmGuard}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-red-500/50"
              >
                Stop Siren
              </button>
            ) : isGuardArmed ? (
              <button
                type="button"
                onClick={onDisarmGuard}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 font-semibold text-xs cursor-pointer"
              >
                Disarm
              </button>
            ) : (
              <button
                type="button"
                onClick={onArmGuard}
                disabled={guardCountdown !== null}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                {guardCountdown !== null ? `${guardCountdown}s` : 'Arm Guard'}
              </button>
            )}
          </div>
        </div>

        {/* 5. Mobile Countdown Timer / Alarm */}
        <div className="mt-4 p-4 rounded-2xl border border-white/10 bg-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-white">Mobile Alarm &amp; Timer</span>
            </div>
            {activeTimerSeconds !== null && (
              <span className="text-sm font-mono font-bold text-amber-400 animate-pulse">
                {Math.floor(activeTimerSeconds / 60)}:
                {(activeTimerSeconds % 60).toString().padStart(2, '0')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={10}
              max={3600}
              step={10}
              value={timerInput}
              onChange={(e) => setTimerInput(parseInt(e.target.value, 10) || 60)}
              className="w-24 px-3 py-1.5 rounded-xl border border-white/10 bg-black text-white text-xs font-mono focus:outline-none focus:border-amber-400"
              placeholder="Secs"
            />
            <span className="text-xs text-slate-400">seconds</span>
            {activeTimerSeconds !== null ? (
              <button
                type="button"
                onClick={handleStopTimer}
                className="ml-auto px-3 py-1.5 rounded-xl bg-red-600/80 hover:bg-red-500 text-xs font-semibold text-white cursor-pointer"
              >
                Cancel Timer
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartTimer}
                className="ml-auto px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" /> Start Timer
              </button>
            )}
          </div>
        </div>

        {/* 6. Quick Phone Call / WhatsApp Launcher */}
        <div className="mt-4 p-4 rounded-2xl border border-white/10 bg-white/5 space-y-3">
          <span className="text-xs font-bold text-white block">
            Calls &amp; WhatsApp Launcher
          </span>
          <div className="flex gap-2">
            <input
              type="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="Phone number (e.g. +92...)"
              className="flex-1 px-3 py-1.5 rounded-xl border border-white/10 bg-black text-white text-xs font-mono focus:outline-none"
            />
            <button
              type="button"
              onClick={() => deviceController.makePhoneCall(phoneInput)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5" /> Call
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={whatsappMsg}
              onChange={(e) => setWhatsappMsg(e.target.value)}
              placeholder="WhatsApp message..."
              className="flex-1 px-3 py-1.5 rounded-xl border border-white/10 bg-black text-white text-xs font-sans focus:outline-none"
            />
            <button
              type="button"
              onClick={() => deviceController.openWhatsApp(whatsappMsg, phoneInput)}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
            </button>
          </div>
        </div>

        {/* 7. Urdu & English Voice Commands List */}
        <div className="mt-5 pt-4 border-t border-white/10 space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
            Speak to Zoya in Urdu or English:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] font-mono text-slate-300">
            <div className="p-2 rounded-lg bg-black/40 border border-white/5">
              &ldquo;Torch on karo&rdquo; / &ldquo;Turn on flashlight&rdquo;
            </div>
            <div className="p-2 rounded-lg bg-black/40 border border-white/5">
              &ldquo;Phone vibrate karo&rdquo;
            </div>
            <div className="p-2 rounded-lg bg-black/40 border border-white/5">
              &ldquo;Battery kitni hai meri?&rdquo;
            </div>
            <div className="p-2 rounded-lg bg-black/40 border border-white/5">
              &ldquo;WhatsApp kholo&rdquo; / &ldquo;Call lagao&rdquo;
            </div>
            <div className="p-2 rounded-lg bg-black/40 border border-white/5">
              &ldquo;1 minute ka timer lagao&rdquo;
            </div>
            <div className="p-2 rounded-lg bg-black/40 border border-white/5">
              &ldquo;Screen on rakho&rdquo;
            </div>
            <div className="p-2 rounded-lg bg-red-950/30 border border-red-500/20 text-red-300">
              &ldquo;Mobile rakh kar ja raha hoon, koi chhue to bolna!&rdquo; (Guard Mode)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
