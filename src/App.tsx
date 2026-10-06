/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AssistantState,
  VibeConfig,
  VibeType,
  VoiceOption,
  HologramWidget,
  LiveTranscript,
  ToolCallData,
} from './types.ts';
import { VIBE_CONFIGS } from './utils/vibes.ts';
import { LiveSession } from './services/LiveSession.ts';
import { DeviceController } from './services/DeviceController.ts';
import { FuturisticVisualizer } from './components/FuturisticVisualizer.tsx';
import { CentralControl } from './components/CentralControl.tsx';
import { TopHud } from './components/TopHud.tsx';
import { ActionCard } from './components/ActionCard.tsx';
import { CaptionsOverlay } from './components/CaptionsOverlay.tsx';
import { VibeSelector } from './components/VibeSelector.tsx';
import { PersonalityModal } from './components/PersonalityModal.tsx';
import { MobileControlDrawer } from './components/MobileControlDrawer.tsx';
import { IntruderAlertModal } from './components/IntruderAlertModal.tsx';
import { SuggestionsTray } from './components/SuggestionsTray.tsx';
import { AlertCircle, X } from 'lucide-react';

export default function App() {
  const [state, setState] = useState<AssistantState>('disconnected');
  const [activeVibeKey, setActiveVibeKey] = useState<VibeType>('cyber_neon');
  const [currentVoice, setCurrentVoice] = useState<VoiceOption>('Aoede');
  const [activeWidget, setActiveWidget] = useState<HologramWidget | null>(null);
  const [lastTranscript, setLastTranscript] = useState<LiveTranscript | null>(null);
  const [showCaptions, setShowCaptions] = useState<boolean>(true);
  const [isVibePickerOpen, setIsVibePickerOpen] = useState<boolean>(false);
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Mobile Hardware & Security Guard States
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [isWakeLockOn, setIsWakeLockOn] = useState<boolean>(false);
  const [isGuardArmed, setIsGuardArmed] = useState<boolean>(false);
  const [isGuardAlarming, setIsGuardAlarming] = useState<boolean>(false);
  const [guardCountdown, setGuardCountdown] = useState<number | null>(null);
  const [guardWarningMessage, setGuardWarningMessage] = useState<string>(
    'Oye! Haath peeche karo! Kiski ijazat se phone chhua? Chhodo foran!'
  );

  const activeVibe = VIBE_CONFIGS[activeVibeKey] || VIBE_CONFIGS.cyber_neon;
  const liveSessionRef = useRef<LiveSession | null>(null);
  const deviceControllerRef = useRef<DeviceController>(new DeviceController());

  // Mutable refs to prevent LiveSession teardown on React state changes
  const guardWarningMessageRef = useRef(guardWarningMessage);
  guardWarningMessageRef.current = guardWarningMessage;

  const isGuardArmedRef = useRef(isGuardArmed);
  isGuardArmedRef.current = isGuardArmed;

  // Arm Motion & Touch Sentry Guard
  const handleArmGuard = useCallback(() => {
    const device = deviceControllerRef.current;
    device.armGuard(
      (countdown) => {
        setGuardCountdown(countdown);
      },
      () => {
        setGuardCountdown(null);
        setIsGuardArmed(true);
        setActiveWidget({
          id: `${Date.now()}`,
          type: 'anti_theft_guard',
          title: 'Guard Mode Armed',
          content: 'Phone rakh do jaan! Agar kisi ne haath lagaya ya hilaya, to Zoya siren baja degi!',
          timestamp: Date.now(),
        });
      },
      (reason) => {
        console.log('[App] Intruder alarm triggered:', reason);
        setIsGuardAlarming(true);
        setActiveWidget({
          id: `${Date.now()}`,
          type: 'intruder_alert',
          title: 'INTRUDER ALARM TRIGGERED!',
          content: guardWarningMessageRef.current,
          timestamp: Date.now(),
        });
      }
    );
  }, []);

  // Disarm Guard & Silence Siren
  const handleDisarmGuard = useCallback(() => {
    const device = deviceControllerRef.current;
    device.disarmGuard();
    setIsGuardArmed(false);
    setIsGuardAlarming(false);
    setGuardCountdown(null);
    setActiveWidget(null);
  }, []);

  // Keep refs for actions to avoid stale closures
  const handleArmGuardRef = useRef(handleArmGuard);
  handleArmGuardRef.current = handleArmGuard;

  const handleDisarmGuardRef = useRef(handleDisarmGuard);
  handleDisarmGuardRef.current = handleDisarmGuard;

  // Handle incoming tool calls from Gemini Live
  const handleToolCall = useCallback((tool: ToolCallData) => {
    console.log('[App] Executing tool:', tool.name, tool.args);
    const device = deviceControllerRef.current;

    if (tool.name === 'toggleAntiTheftGuard') {
      const enable = !!tool.args?.enable;
      if (enable) {
        if (tool.args?.warningMessage) {
          setGuardWarningMessage(tool.args.warningMessage);
        }
        handleArmGuardRef.current();
      } else {
        handleDisarmGuardRef.current();
        setActiveWidget({
          id: `${Date.now()}`,
          type: 'anti_theft_guard',
          title: 'Guard Mode Disarmed',
          content: tool.args?.reason || 'Guard mode band kar diya gaya hai.',
          timestamp: Date.now(),
        });
      }
    } else if (tool.name === 'controlFlashlight') {
      const action = (tool.args?.action || 'toggle').toLowerCase();
      const shouldEnable =
        action === 'on' ? true : action === 'off' ? false : !device.getTorchState();

      device.setFlashlight(shouldEnable).then((res) => {
        setIsTorchOn(res.state);
        setActiveWidget({
          id: `${Date.now()}`,
          type: 'flashlight',
          title: res.state ? 'Torch / Flashlight ON' : 'Torch / Flashlight OFF',
          content:
            tool.args?.reason ||
            (res.state ? 'Phone torch jala di hai jaan!' : 'Torch band kar di hai!'),
          isTorchOn: res.state,
          timestamp: Date.now(),
        });
      });
    } else if (tool.name === 'triggerVibration') {
      const pattern = tool.args?.pattern || 'short';
      device.vibrate(pattern);
      setActiveWidget({
        id: `${Date.now()}`,
        type: 'vibration',
        title: 'Phone Vibrated',
        content: tool.args?.reason || 'Phone ko buzz kar diya, feel hua na?',
        timestamp: Date.now(),
      });
    } else if (tool.name === 'getBatteryStatus') {
      device.getBattery().then((b) => {
        setActiveWidget({
          id: `${Date.now()}`,
          type: 'battery',
          title: `Phone Battery: ${b.level}%`,
          content: `${b.charging ? 'Charging chal rahi hai' : 'Battery power par hai'}. ${
            tool.args?.reason ||
            (b.level < 20 ? 'Battery low hai babe, charge pe lagao!' : 'Full battery power!')
          }`,
          batteryLevel: b.level,
          isCharging: b.charging,
          timestamp: Date.now(),
        });
      });
    } else if (tool.name === 'setScreenWakeLock') {
      const enable = !!tool.args?.enable;
      device.setWakeLock(enable).then(() => {
        setIsWakeLockOn(enable);
        setActiveWidget({
          id: `${Date.now()}`,
          type: 'wake_lock',
          title: enable ? 'Screen Wake Lock ON' : 'Screen Sleep Allowed',
          content:
            tool.args?.reason ||
            (enable ? 'Screen ab hamesha on rahegi!' : 'Screen sleep timeout restored'),
          timestamp: Date.now(),
        });
      });
    } else if (tool.name === 'launchAppOrCall') {
      const actionType = (tool.args?.actionType || 'call').toLowerCase();
      const target = tool.args?.target || '';
      const message = tool.args?.message || '';

      if (actionType === 'call') {
        device.makePhoneCall(target);
      } else if (actionType === 'whatsapp') {
        device.openWhatsApp(message, target);
      } else if (actionType === 'sms') {
        device.sendSMS(message, target);
      } else if (actionType === 'maps') {
        device.openMaps(target || message);
      }

      setActiveWidget({
        id: `${Date.now()}`,
        type: actionType as any,
        title: `Mobile ${actionType.toUpperCase()}`,
        content: tool.args?.reason || `Phone command executed: ${actionType}`,
        target,
        message,
        timestamp: Date.now(),
      });
    } else if (tool.name === 'setTimerAlarm') {
      const seconds = parseInt(tool.args?.seconds, 10) || 60;
      const label = tool.args?.label || 'Zoya Timer';

      device.startTimer(
        seconds,
        label,
        () => {},
        () => {
          setActiveWidget({
            id: `${Date.now()}`,
            type: 'reminder',
            title: 'Alarm Ringing!',
            content: `Timer finished for ${label}! Phone vibrated.`,
            timestamp: Date.now(),
          });
        }
      );

      setActiveWidget({
        id: `${Date.now()}`,
        type: 'timer',
        title: `Timer Active: ${seconds}s`,
        content: `Countdown shuru kar diya hai (${seconds} seconds)!`,
        seconds,
        timestamp: Date.now(),
      });
    } else if (tool.name === 'openWebsite') {
      const url = tool.args?.url || 'https://google.com';
      const siteName = tool.args?.siteName || 'Website';
      const actionReason = tool.args?.actionReason || `Opening ${siteName} for you!`;

      setActiveWidget({
        id: `${Date.now()}`,
        type: 'open_website',
        title: `Opened ${siteName}`,
        content: actionReason,
        url,
        siteName,
        timestamp: Date.now(),
      });
    } else if (tool.name === 'changeVibe') {
      const targetVibe = (tool.args?.vibe || '').toLowerCase().trim();
      const validKeys: VibeType[] = [
        'cyber_neon',
        'rose_glam',
        'midnight_purple',
        'emerald_matrix',
        'sunset_blaze',
        'crimson_pulse',
      ];

      const matched = validKeys.find(
        (k) => k === targetVibe || k.includes(targetVibe) || targetVibe.includes(k)
      );
      if (matched) {
        setActiveVibeKey(matched);
      }

      setActiveWidget({
        id: `${Date.now()}`,
        type: 'vibe_change',
        title: 'Atmosphere Shifted',
        content: tool.args?.reason || `Vibe altered to match the mood.`,
        timestamp: Date.now(),
      });
    } else if (tool.name === 'showHologramWidget') {
      setActiveWidget({
        id: `${Date.now()}`,
        type: 'witty_roast',
        title: tool.args?.title || 'Zoya Hologram Note',
        content: tool.args?.content || 'Here is your note!',
        timestamp: Date.now(),
      });
    } else if (tool.name === 'getLiveStatus') {
      const now = new Date();
      setActiveWidget({
        id: `${Date.now()}`,
        type: 'quote',
        title: 'System Telemetry',
        content: `Local Time: ${now.toLocaleTimeString()} • Live Link: 100% Operational`,
        timestamp: Date.now(),
      });
    }
  }, []);

  const handleToolCallRef = useRef(handleToolCall);
  handleToolCallRef.current = handleToolCall;

  // Initialize LiveSession ONCE on mount with empty dependency array
  useEffect(() => {
    const session = new LiveSession({
      onStateChange: (newState) => {
        setState(newState);
      },
      onToolCall: (tool) => {
        handleToolCallRef.current(tool);
      },
      onTranscript: (t) => {
        setLastTranscript(t);

        // Failsafe: if user says guard phrase and guard is not armed, arm it automatically!
        if (t.role === 'user' || t.role === 'assistant') {
          const lower = t.text.toLowerCase();
          const isGuardIntent =
            lower.includes('rakh kar ja') ||
            lower.includes('rakh ke ja') ||
            lower.includes('chhue to') ||
            lower.includes('guard mode') ||
            lower.includes('nazar rakh') ||
            lower.includes('pehredar') ||
            lower.includes('touch my phone');

          if (isGuardIntent && !isGuardArmedRef.current) {
            console.log('[App] Failsafe: Guard intent detected in speech transcript');
            handleArmGuardRef.current();
          }
        }
      },
      onError: (err) => {
        setErrorMessage(err);
      },
      onVoiceReady: (model, voice) => {
        console.log(`[App] Connected to ${model} with voice ${voice}`);
      },
    });

    liveSessionRef.current = session;

    return () => {
      session.destroy();
      deviceControllerRef.current.destroy();
    };
  }, []); // NEVER RE-CREATE SESSION ON STATE CHANGES!

  const handleToggleSession = async () => {
    setErrorMessage(null);
    const session = liveSessionRef.current;
    if (!session) return;

    if (state === 'disconnected' || state === 'error') {
      await session.connect(currentVoice);
    } else {
      session.disconnect();
    }
  };

  const handleInterrupt = () => {
    liveSessionRef.current?.interrupt();
  };

  const handleChangeVoice = (newVoice: VoiceOption) => {
    setCurrentVoice(newVoice);
    liveSessionRef.current?.changeVoice(newVoice);
  };

  const handleSelectVibe = (newVibe: VibeType) => {
    setActiveVibeKey(newVibe);
  };

  const handleToggleTorch = () => {
    const device = deviceControllerRef.current;
    device.setFlashlight().then((res) => {
      setIsTorchOn(res.state);
      setActiveWidget({
        id: `${Date.now()}`,
        type: 'flashlight',
        title: res.state ? 'Torch / Flashlight ON' : 'Torch / Flashlight OFF',
        content: res.state ? 'Phone torch jala di hai!' : 'Torch band kar di!',
        isTorchOn: res.state,
        timestamp: Date.now(),
      });
    });
  };

  const handleToggleWakeLock = () => {
    const device = deviceControllerRef.current;
    const target = !isWakeLockOn;
    device.setWakeLock(target).then(() => {
      setIsWakeLockOn(target);
      setActiveWidget({
        id: `${Date.now()}`,
        type: 'wake_lock',
        title: target ? 'Screen Wake Lock ON' : 'Screen Sleep Allowed',
        content: target ? 'Screen awake lock active' : 'Normal screen timeout',
        timestamp: Date.now(),
      });
    });
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black text-white select-none flex flex-col font-sans">
      {/* Background Gradient Mesh */}
      <div
        className={`absolute inset-0 bg-radial transition-all duration-1000 opacity-60 pointer-events-none ${activeVibe.bgGradient}`}
      />

      {/* Screen Torch Flash Ambient Glow when Flashlight is active */}
      {isTorchOn && (
        <div className="absolute inset-0 bg-white/40 z-10 pointer-events-none animate-pulse transition-opacity duration-300" />
      )}

      {/* Futuristic Cyber Grid Texture */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(${activeVibe.primary}22 1px, transparent 1px), linear-gradient(90deg, ${activeVibe.primary}22 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Top Header HUD */}
      <TopHud
        state={state}
        vibe={activeVibe}
        currentVoice={currentVoice}
        onChangeVoice={handleChangeVoice}
        onOpenVibePicker={() => setIsVibePickerOpen(true)}
        onOpenInfo={() => setIsInfoOpen(true)}
        onOpenMobileControls={() => setIsMobileDrawerOpen(true)}
        showCaptions={showCaptions}
        onToggleCaptions={() => setShowCaptions(!showCaptions)}
        isTorchOn={isTorchOn}
        isGuardArmed={isGuardArmed}
        isGuardAlarming={isGuardAlarming}
      />

      {/* Error Banner */}
      {errorMessage && (
        <div className="relative z-40 mx-4 mt-2 px-4 py-2 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="p-1 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Live Captions Subtitle Overlay */}
      <CaptionsOverlay
        lastTranscript={lastTranscript}
        vibe={activeVibe}
        showCaptions={showCaptions}
      />

      {/* Center Stage: Futuristic Audio Reactive Visualizer */}
      <main className="relative flex-1 flex items-center justify-center">
        <FuturisticVisualizer
          state={state}
          vibe={activeVibe}
          recorder={liveSessionRef.current ? liveSessionRef.current.getRecorder() : null}
          streamer={liveSessionRef.current ? liveSessionRef.current.getStreamer() : null}
          onClickCore={handleToggleSession}
        />
      </main>

      {/* Floating Holographic Action Card (Tool Calls) */}
      <ActionCard
        widget={activeWidget}
        vibe={activeVibe}
        onDismiss={() => setActiveWidget(null)}
        onActionClick={(action) => {
          if (action === 'toggle_torch') {
            handleToggleTorch();
          } else if (action === 'disarm_guard') {
            handleDisarmGuard();
          }
        }}
      />

      {/* Bottom Cockpit: Control Core & Suggestions */}
      <div className="relative z-30 pb-6 pt-2 flex flex-col items-center">
        <CentralControl
          state={state}
          vibe={activeVibe}
          onToggle={handleToggleSession}
          onInterrupt={handleInterrupt}
        />

        <div className="mt-4 w-full">
          <SuggestionsTray vibe={activeVibe} isLive={state !== 'disconnected'} />
        </div>
      </div>

      {/* Mobile Control Hub Modal Drawer */}
      <MobileControlDrawer
        isOpen={isMobileDrawerOpen}
        vibe={activeVibe}
        deviceController={deviceControllerRef.current}
        isTorchOn={isTorchOn}
        isWakeLockOn={isWakeLockOn}
        isGuardArmed={isGuardArmed}
        isGuardAlarming={isGuardAlarming}
        guardCountdown={guardCountdown}
        onToggleTorch={handleToggleTorch}
        onToggleWakeLock={handleToggleWakeLock}
        onArmGuard={handleArmGuard}
        onDisarmGuard={handleDisarmGuard}
        onClose={() => setIsMobileDrawerOpen(false)}
      />

      {/* Fullscreen Intruder Alarm Alert Modal */}
      <IntruderAlertModal
        isOpen={isGuardAlarming}
        warningMessage={guardWarningMessage}
        onDisarm={handleDisarmGuard}
      />

      {/* Vibe Selector Modal */}
      <VibeSelector
        isOpen={isVibePickerOpen}
        activeVibe={activeVibe}
        onSelectVibe={handleSelectVibe}
        onClose={() => setIsVibePickerOpen(false)}
      />

      {/* Personality & Prompts Info Modal */}
      <PersonalityModal
        isOpen={isInfoOpen}
        vibe={activeVibe}
        onClose={() => setIsInfoOpen(false)}
      />
    </div>
  );
}
