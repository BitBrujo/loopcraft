"use client";

import React, { useEffect, useRef } from 'react';

// Themes: power of softness, water's way, universal truth
// Visualization: Bars that yield and flow like water, demonstrating how gentleness overcomes the rigid

const Artwork33 = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  // Simple noise function
  const noise = (x: number, y: number, t: number) => {
    const n = Math.sin(x * 0.01 + t) * Math.cos(y * 0.01 + t) +
             Math.sin(x * 0.015 - t) * Math.cos(y * 0.005 + t);
    return (n + 1) / 2;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size - full width but constrained height for viewport fit
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = 200; // Fixed height to fit with title and cards in viewport
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Scale number of lines based on canvas height (200px vs original 550px)
    const numLines = Math.floor(50 * (canvas.height / 550));
    const lineSpacing = canvas.height / numLines;

    // Orange brand color
    const ORANGE = '#f97316';

    const animate = () => {
      timeRef.current += 0.0005;

      // Clear canvas with transparency
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw lines and noise-based bars
      for (let i = 0; i < numLines; i++) {
        const y = i * lineSpacing + lineSpacing / 2;

        // Draw horizontal line in orange
        ctx.beginPath();
        ctx.strokeStyle = ORANGE;
        ctx.lineWidth = 1;
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();

        // Draw bars based on noise in orange
        for (let x = 0; x < canvas.width; x += 8) {
          const noiseVal = noise(x, y, timeRef.current);

          if (noiseVal > 0.5) {
            const barWidth = 3 + noiseVal * 10;
            const barHeight = 2 + noiseVal * 3;
            const animatedX = x + Math.sin(timeRef.current + y * 0.0375) * 20 * noiseVal;

            ctx.fillStyle = ORANGE;
            ctx.fillRect(animatedX - barWidth/2, y - barHeight/2, barWidth, barHeight);
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      window.removeEventListener('resize', resizeCanvas);

      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      timeRef.current = 0;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-auto block"
      style={{ background: 'transparent' }}
    />
  );
};

export default Artwork33;
