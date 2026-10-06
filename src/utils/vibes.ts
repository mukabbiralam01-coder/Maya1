/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VibeConfig, VibeType } from '../types.ts';

export const VIBE_CONFIGS: Record<VibeType, VibeConfig> = {
  cyber_neon: {
    id: 'cyber_neon',
    name: 'Cyber Neon',
    tagline: 'Electric cyan and neon blue futuristic pulse',
    primary: '#06b6d4',
    secondary: '#3b82f6',
    glow: 'rgba(6, 182, 212, 0.6)',
    bgGradient: 'from-cyan-950/40 via-slate-950 to-black',
    accentClass: 'border-cyan-500/40 text-cyan-400 shadow-cyan-500/20',
  },
  rose_glam: {
    id: 'rose_glam',
    name: 'Rose Glam',
    tagline: 'Sassy hot pink and radiant rose gold',
    primary: '#f43f5e',
    secondary: '#fb7185',
    glow: 'rgba(244, 63, 94, 0.6)',
    bgGradient: 'from-rose-950/40 via-neutral-950 to-black',
    accentClass: 'border-rose-500/40 text-rose-400 shadow-rose-500/20',
  },
  midnight_purple: {
    id: 'midnight_purple',
    name: 'Midnight Purple',
    tagline: 'Seductive cosmic violet and electric indigo',
    primary: '#a855f7',
    secondary: '#8b5cf6',
    glow: 'rgba(168, 85, 247, 0.6)',
    bgGradient: 'from-purple-950/40 via-slate-950 to-black',
    accentClass: 'border-purple-500/40 text-purple-400 shadow-purple-500/20',
  },
  emerald_matrix: {
    id: 'emerald_matrix',
    name: 'Emerald Matrix',
    tagline: 'Futuristic quantum green and mint sheen',
    primary: '#10b981',
    secondary: '#14b8a6',
    glow: 'rgba(16, 185, 129, 0.6)',
    bgGradient: 'from-emerald-950/40 via-slate-950 to-black',
    accentClass: 'border-emerald-500/40 text-emerald-400 shadow-emerald-500/20',
  },
  sunset_blaze: {
    id: 'sunset_blaze',
    name: 'Sunset Blaze',
    tagline: 'Passionate amber and fiery golden coral',
    primary: '#f97316',
    secondary: '#fb923c',
    glow: 'rgba(249, 115, 22, 0.6)',
    bgGradient: 'from-orange-950/40 via-neutral-950 to-black',
    accentClass: 'border-orange-500/40 text-orange-400 shadow-orange-500/20',
  },
  crimson_pulse: {
    id: 'crimson_pulse',
    name: 'Crimson Pulse',
    tagline: 'Bold velvet red and ruby energy surge',
    primary: '#ef4444',
    secondary: '#f43f5e',
    glow: 'rgba(239, 68, 68, 0.6)',
    bgGradient: 'from-red-950/40 via-stone-950 to-black',
    accentClass: 'border-red-500/40 text-red-400 shadow-red-500/20',
  },
};
