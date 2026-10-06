/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { AssistantState, VibeConfig } from '../types.ts';
import { AudioRecorder } from '../services/AudioRecorder.ts';
import { AudioStreamer } from '../services/AudioStreamer.ts';

interface FuturisticVisualizerProps {
  state: AssistantState;
  vibe: VibeConfig;
  recorder: AudioRecorder | null;
  streamer: AudioStreamer | null;
  onClickCore?: () => void;
}

export const FuturisticVisualizer: React.FC<FuturisticVisualizerProps> = ({
  state,
  vibe,
  recorder,
  streamer,
  onClickCore,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const freqData = new Uint8Array(64);

    const render = () => {
      timeRef.current += 0.03;
      const t = timeRef.current;

      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = Math.min(width, height) * (width < 640 ? 0.22 : 0.18);

      // Determine active audio intensity based on state
      let activeVolume = 0;
      if (state === 'speaking' && streamer) {
        streamer.getFrequencyData(freqData);
        activeVolume = streamer.getVolume();
      } else if (state === 'listening' && recorder) {
        recorder.getFrequencyData(freqData);
        activeVolume = recorder.getVolume();
      } else {
        freqData.fill(0);
      }

      // Base idle breathing oscillation
      const breathing = Math.sin(t * 1.5) * 4;
      const currentRadius = baseRadius + breathing + activeVolume * 35;

      // Draw background ambient glow
      const bgGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        currentRadius * 0.2,
        centerX,
        centerY,
        currentRadius * 2.8
      );
      if (state === 'disconnected') {
        bgGradient.addColorStop(0, 'rgba(20, 24, 33, 0.4)');
        bgGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else if (state === 'connecting') {
        bgGradient.addColorStop(0, `${vibe.primary}33`);
        bgGradient.addColorStop(0.5, `${vibe.secondary}15`);
        bgGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else if (state === 'speaking') {
        bgGradient.addColorStop(0, `${vibe.primary}66`);
        bgGradient.addColorStop(0.4, `${vibe.secondary}33`);
        bgGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        // listening / idle
        bgGradient.addColorStop(0, `${vibe.primary}44`);
        bgGradient.addColorStop(0.5, `${vibe.secondary}1a`);
        bgGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }

      ctx.fillStyle = bgGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, currentRadius * 2.8, 0, Math.PI * 2);
      ctx.fill();

      // Draw outer cybernetic orbiting arcs
      if (state !== 'disconnected') {
        const numArcs = 3;
        for (let i = 0; i < numArcs; i++) {
          const arcRadius = currentRadius + 30 + i * 22;
          const speed = (i % 2 === 0 ? 1 : -1) * (0.8 + i * 0.3);
          const startAngle = t * speed + (i * Math.PI) / 2;
          const arcLength = (Math.PI / 2.5) * (1 + activeVolume * 0.5);

          ctx.save();
          ctx.beginPath();
          ctx.arc(centerX, centerY, arcRadius, startAngle, startAngle + arcLength);
          ctx.strokeStyle = i === 0 ? vibe.primary : vibe.secondary;
          ctx.lineWidth = 1.8 + activeVolume * 2;
          ctx.globalAlpha = 0.4 + activeVolume * 0.4;
          ctx.shadowBlur = 12;
          ctx.shadowColor = vibe.primary;
          ctx.stroke();

          // Small tracker dot on arc
          const dotX = centerX + Math.cos(startAngle + arcLength) * arcRadius;
          const dotY = centerY + Math.sin(startAngle + arcLength) * arcRadius;
          ctx.beginPath();
          ctx.arc(dotX, dotY, 2.5 + activeVolume * 2, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.restore();
        }
      }

      // Draw audio frequency waveform rings
      const numPoints = 80;
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i <= numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        const binIndex = i % freqData.length;
        const freqValue = freqData[binIndex] / 255.0;

        let waveOffset = 0;
        if (state === 'speaking') {
          waveOffset = Math.sin(angle * 7 + t * 4) * (freqValue * 38 + 6);
        } else if (state === 'listening') {
          waveOffset = Math.sin(angle * 5 + t * 3) * (freqValue * 28 + activeVolume * 15);
        } else if (state === 'connecting') {
          waveOffset = Math.sin(angle * 4 + t * 6) * 6;
        }

        const r = currentRadius + waveOffset;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();

      if (state === 'disconnected') {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else {
        const strokeGradient = ctx.createLinearGradient(
          centerX - currentRadius,
          centerY - currentRadius,
          centerX + currentRadius,
          centerY + currentRadius
        );
        strokeGradient.addColorStop(0, vibe.primary);
        strokeGradient.addColorStop(0.5, '#ffffff');
        strokeGradient.addColorStop(1, vibe.secondary);

        ctx.strokeStyle = strokeGradient;
        ctx.lineWidth = 2.5 + activeVolume * 3;
        ctx.shadowBlur = 18 + activeVolume * 20;
        ctx.shadowColor = vibe.primary;
        ctx.stroke();

        ctx.fillStyle = `${vibe.primary}15`;
        ctx.fill();
      }
      ctx.restore();

      // Inner Core Holographic Sphere
      const innerCoreGrad = ctx.createRadialGradient(
        centerX - currentRadius * 0.25,
        centerY - currentRadius * 0.25,
        4,
        centerX,
        centerY,
        currentRadius * 0.85
      );

      if (state === 'disconnected') {
        innerCoreGrad.addColorStop(0, '#1e293b');
        innerCoreGrad.addColorStop(0.7, '#0f172a');
        innerCoreGrad.addColorStop(1, '#020617');
      } else if (state === 'connecting') {
        innerCoreGrad.addColorStop(0, '#ffffff');
        innerCoreGrad.addColorStop(0.3, vibe.primary);
        innerCoreGrad.addColorStop(1, '#090d16');
      } else if (state === 'speaking') {
        innerCoreGrad.addColorStop(0, '#ffffff');
        innerCoreGrad.addColorStop(0.35, vibe.secondary);
        innerCoreGrad.addColorStop(0.8, vibe.primary);
        innerCoreGrad.addColorStop(1, '#050510');
      } else {
        // listening / idle
        innerCoreGrad.addColorStop(0, '#ffffff');
        innerCoreGrad.addColorStop(0.2, vibe.primary);
        innerCoreGrad.addColorStop(0.7, `${vibe.secondary}aa`);
        innerCoreGrad.addColorStop(1, '#040711');
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, currentRadius * 0.85, 0, Math.PI * 2);
      ctx.fillStyle = innerCoreGrad;
      ctx.shadowBlur = state !== 'disconnected' ? 25 + activeVolume * 30 : 5;
      ctx.shadowColor = state !== 'disconnected' ? vibe.primary : 'rgba(0,0,0,0.5)';
      ctx.fill();
      ctx.restore();

      // Tech HUD crosshairs and tick marks on the core
      ctx.save();
      ctx.strokeStyle = state === 'disconnected' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1;

      // 4 cardinal tick marks
      const tickDist = currentRadius * 0.95;
      const tickLen = 8;
      const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
      for (const a of angles) {
        const x1 = centerX + Math.cos(a) * tickDist;
        const y1 = centerY + Math.sin(a) * tickDist;
        const x2 = centerX + Math.cos(a) * (tickDist + tickLen);
        const y2 = centerY + Math.sin(a) * (tickDist + tickLen);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.restore();

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [state, vibe, recorder, streamer]);

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
      <canvas ref={canvasRef} className="w-full h-full block" />
      {/* Invisible clickable hit target right over the core */}
      <button
        type="button"
        onClick={onClickCore}
        className="absolute w-48 h-48 sm:w-56 sm:h-56 rounded-full pointer-events-auto cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
        aria-label="Toggle Zoya Voice Session"
      />
    </div>
  );
};
