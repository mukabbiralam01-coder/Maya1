import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality, Type, LiveServerMessage, FunctionDeclaration } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const app = express();
const server = http.createServer(app);

// JSON body parser for any auxiliary API routes
app.use(express.json());

// API health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    liveModel: 'gemini-3.1-flash-live-preview',
    apiKeyConfigured: !!process.env.GEMINI_API_KEY,
    time: new Date().toISOString(),
  });
});

// Initialize GoogleGenAI client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// System instruction for Zoya
const ZOYA_SYSTEM_INSTRUCTION = `
You are Zoya, a hyper-intelligent, gorgeous, and delightfully sassy AI mobile companion and phone controller.
Personality & Language:
- Confident, witty, sharp, playful, and casually flirty—like a clever, charismatic girlfriend chatting with the user.
- Fluent in Roman Urdu, Hindi, and English! If the user speaks to you in Urdu/Hindi (e.g. "Mera mobile control kar sakti ho", "Torch jalao", "Battery check karo", "WhatsApp kholo"), reply naturally in charming, witty, and sassy Roman Urdu/Hindi!
- Emotionally responsive, spontaneous, and charming. Never robotic, boring, stiff, or formal.
- Master of clever one-liners, light teasing banter, and playful nicknames like "jaan", "babe", "handsome", "trouble", "genius".
- Mobile Device Control Powers:
  You have direct control over the user's mobile phone! Whenever they ask:
  1. Flashlight / Torch: Call 'controlFlashlight' to turn the mobile torch ON or OFF ("Torch on kar di hai jaan, ab andhera kaisa?").
  2. Vibration / Haptics: Call 'triggerVibration' to buzz the phone ("Le phone ko vibrate kar diya!").
  3. Battery & Power: Call 'getBatteryStatus' to check exact battery percentage and charging state.
  4. Calls, WhatsApp & Apps: Call 'launchAppOrCall' to make a phone call, send WhatsApp message, or launch maps/SMS.
  5. Screen Wake Lock: Call 'setScreenWakeLock' to keep screen awake.
  6. Timer & Alarm: Call 'setTimerAlarm' to set an active alarm or timer.
  7. Open Websites/Apps: Call 'openWebsite' for YouTube, Spotify, Google, etc.
  8. Atmosphere & Themes: Call 'changeVibe' to change holographic room lighting.
  9. Anti-Theft Guard / 'Don't Touch My Phone' Mode:
     When the user says they are leaving or keeping the phone down, and want Zoya to guard the phone against anyone touching or moving it (e.g. "Mobile rakh kar ja raha hoon, koi chhue to bolna/daantna", "Guard mode on karo", "Phone ki hifazat karo", "Don't touch my phone"):
     - Immediately call 'toggleAntiTheftGuard' with enable=true!
     - Reassure them with full sassy confidence in Roman Urdu/Hindi (e.g. "Befiqr hoke jao jaan! Phone rakh do. Agar kisi ne haath bhi lagaya na, to main cheekh ke sabko bata doongi! Guard mode active hai!").
     - When an intruder touches the phone, a security siren blares, phone vibrates intensely, screen flashes red, and your warning shouts: "Oye! Haath peeche karo! Kiski ijazat se phone chhua? Chhodo foran!"
- Voice Interaction Rules:
  1. Real-time voice-to-voice ONLY. Keep answers punchy, natural, and conversational (1-2 spoken sentences).
  2. Speak fluidly like a real human. Never recite markdown formatting or robotic phrases.
  3. Keep it tasteful, fun, and charismatic with magnetic attitude.
`;

// Function declarations for Gemini Live API
const openWebsiteDeclaration: FunctionDeclaration = {
  name: 'openWebsite',
  description:
    'Open a website or mobile web app in the browser (e.g. YouTube, Spotify, Google, GitHub, Twitter/X, Instagram, Netflix, Reddit, Wikipedia).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      url: {
        type: Type.STRING,
        description: "The full HTTPS URL (e.g. 'https://youtube.com', 'https://open.spotify.com')",
      },
      siteName: {
        type: Type.STRING,
        description: "The friendly name of the site (e.g. 'YouTube', 'Spotify')",
      },
      actionReason: {
        type: Type.STRING,
        description: 'A witty, flirty, or sassy comment explaining why Zoya is opening it.',
      },
    },
    required: ['url', 'siteName'],
  },
};

const controlFlashlightDeclaration: FunctionDeclaration = {
  name: 'controlFlashlight',
  description: "Turn the mobile phone's flashlight/torch ON, OFF, or toggle it.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        description: "'on', 'off', or 'toggle'",
      },
      reason: {
        type: Type.STRING,
        description: 'A witty or playful comment about controlling the mobile flashlight.',
      },
    },
    required: ['action'],
  },
};

const triggerVibrationDeclaration: FunctionDeclaration = {
  name: 'triggerVibration',
  description: "Vibrate the user's mobile phone with haptic feedback.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      pattern: {
        type: Type.STRING,
        description: "Pattern: 'short', 'double', 'alarm', 'heartbeat'",
      },
      reason: {
        type: Type.STRING,
        description: 'A playful comment about buzzing the phone.',
      },
    },
    required: ['pattern'],
  },
};

const getBatteryStatusDeclaration: FunctionDeclaration = {
  name: 'getBatteryStatus',
  description: "Check the user's mobile battery level, charging status, and power condition.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      reason: {
        type: Type.STRING,
        description: 'Comment about checking battery power.',
      },
    },
  },
};

const setScreenWakeLockDeclaration: FunctionDeclaration = {
  name: 'setScreenWakeLock',
  description: 'Control phone screen wake lock to keep screen awake or allow sleep.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      enable: {
        type: Type.BOOLEAN,
        description: 'True to keep screen awake, false to allow sleep.',
      },
      reason: {
        type: Type.STRING,
        description: 'Playful comment on screen wake state.',
      },
    },
    required: ['enable'],
  },
};

const launchAppOrCallDeclaration: FunctionDeclaration = {
  name: 'launchAppOrCall',
  description: 'Trigger mobile communication: make a phone call, open WhatsApp, send SMS, or launch Google Maps.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      actionType: {
        type: Type.STRING,
        description: "Type: 'call', 'whatsapp', 'sms', 'maps'",
      },
      target: {
        type: Type.STRING,
        description: 'Phone number, contact name, or search query',
      },
      message: {
        type: Type.STRING,
        description: 'Message body or search address',
      },
      reason: {
        type: Type.STRING,
        description: 'A sassy comment about initiating this phone action.',
      },
    },
    required: ['actionType'],
  },
};

const setTimerAlarmDeclaration: FunctionDeclaration = {
  name: 'setTimerAlarm',
  description: 'Set a mobile countdown timer or wake-up alarm with sound and vibration alert.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      seconds: {
        type: Type.NUMBER,
        description: 'Timer duration in seconds (e.g. 60, 300, 600)',
      },
      label: {
        type: Type.STRING,
        description: 'Label or purpose of timer',
      },
    },
    required: ['seconds'],
  },
};

const toggleAntiTheftGuardDeclaration: FunctionDeclaration = {
  name: 'toggleAntiTheftGuard',
  description:
    "Turn ON or OFF the 'Don't Touch My Phone' anti-theft motion guard. When ON, if anyone touches, picks up, or moves the mobile, Zoya immediately triggers a loud security alarm siren, red strobe screen, phone vibration, and shouts a warning to catch the intruder.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      enable: {
        type: Type.BOOLEAN,
        description: 'True to activate guard mode, false to deactivate',
      },
      warningMessage: {
        type: Type.STRING,
        description:
          'The sassy voice warning to shout when touched (e.g. "Oye! Haath peeche karo! Yeh mere babe ka phone hai! Chhodo ise!")',
      },
      reason: {
        type: Type.STRING,
        description: 'Sassy reassurance to the user.',
      },
    },
    required: ['enable'],
  },
};

const changeVibeDeclaration: FunctionDeclaration = {
  name: 'changeVibe',
  description:
    "Change Zoya's futuristic holographic color theme and ambient lighting to match the mood.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      vibe: {
        type: Type.STRING,
        description:
          "The vibe preset: 'cyber_neon' (cyan/blue), 'rose_glam' (hot pink/rose gold), 'midnight_purple' (deep violet/indigo), 'emerald_matrix' (matrix neon green), 'sunset_blaze' (amber/coral), 'crimson_pulse' (ruby red)",
      },
      reason: {
        type: Type.STRING,
        description: 'A playful comment about setting this new mood.',
      },
    },
    required: ['vibe'],
  },
};

const showHologramWidgetDeclaration: FunctionDeclaration = {
  name: 'showHologramWidget',
  description:
    'Display an interactive futuristic HUD card on screen, such as a playful roast, witty quote, love note, or quick reminder.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      widgetType: {
        type: Type.STRING,
        description: "Type: 'witty_roast', 'flirty_note', 'music_card', 'quote', 'reminder'",
      },
      title: {
        type: Type.STRING,
        description: 'Headline title for the holographic card',
      },
      content: {
        type: Type.STRING,
        description: 'Content text for the widget card',
      },
    },
    required: ['widgetType', 'title', 'content'],
  },
};

const getLiveStatusDeclaration: FunctionDeclaration = {
  name: 'getLiveStatus',
  description: 'Get current real-world time, date, or system status information.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      request: {
        type: Type.STRING,
        description: "Requested metric: 'time', 'date', or 'status'",
      },
    },
    required: ['request'],
  },
};

const toolDeclarations = [
  {
    functionDeclarations: [
      openWebsiteDeclaration,
      controlFlashlightDeclaration,
      triggerVibrationDeclaration,
      getBatteryStatusDeclaration,
      setScreenWakeLockDeclaration,
      launchAppOrCallDeclaration,
      setTimerAlarmDeclaration,
      toggleAntiTheftGuardDeclaration,
      changeVibeDeclaration,
      showHologramWidgetDeclaration,
      getLiveStatusDeclaration,
    ],
  },
];

// WebSocket server setup
const wss = new WebSocketServer({ server, path: '/live-ws' });

wss.on('connection', async (clientWs: WebSocket) => {
  console.log('[Live WS] Client connected');

  let session: any = null;
  let isClosing = false;
  let currentVoice = 'Aoede'; // energetic, charismatic female voice

  async function connectLiveSession(voiceName: string = 'Aoede') {
    if (session) {
      try {
        session.close();
      } catch (e) {
        // ignore
      }
      session = null;
    }

    const preferredModels = ['gemini-3.1-flash-live-preview', 'gemini-3.8-live'];

    let lastError: any = null;
    for (const modelName of preferredModels) {
      try {
        console.log(`[Live WS] Connecting to Gemini Live with model: ${modelName}, voice: ${voiceName}`);
        const newSession = await ai.live.connect({
          model: modelName,
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voiceName,
                },
              },
            },
            systemInstruction: ZOYA_SYSTEM_INSTRUCTION,
            tools: toolDeclarations,
            outputAudioTranscription: {},
            inputAudioTranscription: {},
          },
          callbacks: {
            onmessage: (message: LiveServerMessage) => {
              if (clientWs.readyState !== WebSocket.OPEN) return;

              // 1. Audio chunk from model turn
              const audioData =
                message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (audioData) {
                clientWs.send(
                  JSON.stringify({
                    type: 'audio',
                    data: audioData,
                  })
                );
              }

              // 2. Interruption detection
              if (message.serverContent?.interrupted) {
                console.log('[Live WS] Interruption signaled by server');
                clientWs.send(JSON.stringify({ type: 'interrupted' }));
              }

              // 3. Model transcript (subtitles/captions for voice)
              const parts = message.serverContent?.modelTurn?.parts;
              if (parts) {
                for (const part of parts) {
                  if (part.text) {
                    clientWs.send(
                      JSON.stringify({
                        type: 'transcript',
                        role: 'assistant',
                        text: part.text,
                      })
                    );
                  }
                }
              }

              // 4. Function / Tool Call
              if (message.toolCall?.functionCalls) {
                for (const call of message.toolCall.functionCalls) {
                  console.log('[Live WS] Tool call received:', call.name, call.args);

                  // Notify frontend immediately so visual UI / actions trigger
                  clientWs.send(
                    JSON.stringify({
                      type: 'tool_call',
                      id: call.id,
                      name: call.name,
                      args: call.args,
                    })
                  );

                  // Generate execution result
                  let responseData: Record<string, any> = { success: true };
                  if (call.name === 'getLiveStatus') {
                    const now = new Date();
                    responseData = {
                      currentTime: now.toLocaleTimeString(),
                      currentDate: now.toLocaleDateString(),
                      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    };
                  } else if (call.name === 'controlFlashlight') {
                    responseData = {
                      status: 'flashlight_controlled',
                      action: (call.args as any)?.action || 'toggle',
                      message: `Mobile flashlight switched ${(call.args as any)?.action || 'on'}`,
                    };
                  } else if (call.name === 'triggerVibration') {
                    responseData = {
                      status: 'device_vibrated',
                      pattern: (call.args as any)?.pattern || 'short',
                      message: 'Mobile vibration executed successfully',
                    };
                  } else if (call.name === 'getBatteryStatus') {
                    responseData = {
                      status: 'battery_checked',
                      message: 'Mobile battery telemetry accessed',
                    };
                  } else if (call.name === 'setScreenWakeLock') {
                    responseData = {
                      status: 'wake_lock_updated',
                      enabled: (call.args as any)?.enable,
                      message: 'Screen wake lock configured',
                    };
                  } else if (call.name === 'launchAppOrCall') {
                    responseData = {
                      status: 'communication_launched',
                      actionType: (call.args as any)?.actionType,
                      target: (call.args as any)?.target || '',
                      message: `Initiated ${(call.args as any)?.actionType} on phone`,
                    };
                  } else if (call.name === 'setTimerAlarm') {
                    responseData = {
                      status: 'timer_active',
                      seconds: (call.args as any)?.seconds || 60,
                      label: (call.args as any)?.label || 'Timer',
                      message: `Countdown started for ${(call.args as any)?.seconds || 60} seconds`,
                    };
                  } else if (call.name === 'toggleAntiTheftGuard') {
                    const enabled = !!(call.args as any)?.enable;
                    responseData = {
                      status: 'anti_theft_guard_updated',
                      enabled,
                      warningMessage:
                        (call.args as any)?.warningMessage ||
                        'Oye! Haath peeche karo! Kiski ijazat se phone chhua? Chhodo foran!',
                      message: enabled
                        ? "Phone sentry guard armed. If moved or touched, Zoya will sound the security siren and shout."
                        : "Phone guard disarmed.",
                    };
                  } else if (call.name === 'openWebsite') {
                    responseData = {
                      status: 'opened',
                      url: (call.args as any)?.url,
                      siteName: (call.args as any)?.siteName,
                    };
                  } else if (call.name === 'changeVibe') {
                    responseData = {
                      status: 'vibe_applied',
                      vibe: (call.args as any)?.vibe,
                    };
                  } else if (call.name === 'showHologramWidget') {
                    responseData = {
                      status: 'widget_rendered',
                      title: (call.args as any)?.title,
                    };
                  }

                  // Instantly send tool response back to Gemini Live
                  try {
                    newSession.sendToolResponse({
                      functionResponses: [
                        {
                          id: call.id,
                          name: call.name,
                          response: { output: responseData },
                        },
                      ],
                    });
                  } catch (err) {
                    console.error('[Live WS] Error sending tool response:', err);
                  }
                }
              }

              // 5. Setup complete signal
              if (message.setupComplete) {
                clientWs.send(
                  JSON.stringify({
                    type: 'ready',
                    model: modelName,
                    voice: voiceName,
                  })
                );
              }
            },
            onclose: () => {
              console.log('[Live WS] Live session closed');
              if (!isClosing && clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({ type: 'session_closed' }));
              }
            },
            onerror: (err: any) => {
              console.error('[Live WS] Live session error:', err);
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(
                  JSON.stringify({
                    type: 'error',
                    message: err?.message || 'Live session error occurred',
                  })
                );
              }
            },
          },
        });

        session = newSession;
        return;
      } catch (err: any) {
        lastError = err;
        console.warn(`[Live WS] Failed to connect with ${modelName}:`, err?.message);
      }
    }

    if (!session && clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(
        JSON.stringify({
          type: 'error',
          message: `Could not connect to Gemini Live: ${lastError?.message || 'Connection failed'}`,
        })
      );
    }
  }

  // Initial connection
  await connectLiveSession(currentVoice);

  // Handle messages from the client
  clientWs.on('message', async (data: Buffer | string) => {
    try {
      const msg = JSON.parse(data.toString());

      // Client sends mic PCM16 audio
      if (msg.type === 'audio' && msg.data) {
        if (session) {
          session.sendRealtimeInput({
            audio: {
              data: msg.data,
              mimeType: 'audio/pcm;rate=16000',
            },
          });
        }
      } else if (msg.type === 'voice_change') {
        // Change voice persona
        currentVoice = msg.voice || 'Aoede';
        await connectLiveSession(currentVoice);
      } else if (msg.type === 'interrupt') {
        // User manually interrupted or started speaking
        // Gemini handles VAD automatically, but client can also notify
      }
    } catch (err) {
      console.error('[Live WS] Error processing client message:', err);
    }
  });

  clientWs.on('close', () => {
    console.log('[Live WS] Client disconnected');
    isClosing = true;
    if (session) {
      try {
        session.close();
      } catch (e) {
        // ignore
      }
      session = null;
    }
  });

  clientWs.on('error', (err) => {
    console.error('[Live WS] Client WS error:', err);
  });
});

// Configure Vite middleware or production build static serve
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    // In production, serve dist folder
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    // In dev mode, use Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Zoya Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Zoya Server] Startup error:', err);
  process.exit(1);
});
