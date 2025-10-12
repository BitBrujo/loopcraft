"use client";

import React, { useEffect, useRef } from 'react';

// themes: success equals failure, hope equals fear, finding balance in self
// visualization: A double helix where opposing forces dance in perfect equilibrium

const Artwork33 = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Make canvas responsive with max height of 250px
    const resizeCanvas = () => {
      const containerWidth = container.offsetWidth;
      const maxHeight = 250; // Maximum height to fit page
      const aspectRatio = 16 / 5; // Wider ratio for shorter canvas
      const width = Math.min(containerWidth, 800);
      const height = Math.min(width / aspectRatio, maxHeight);

      canvas.width = width;
      canvas.height = height;

      return { width, height };
    };

    let { width, height } = resizeCanvas();

    // Handle window resize
    const handleResize = () => {
      const dimensions = resizeCanvas();
      width = dimensions.width;
      height = dimensions.height;
    };
    window.addEventListener('resize', handleResize);

    // Core variables
    let time = 0;
    const particles: HelixParticle[] = [];
    let helixPoints: HelixPoint[] = [];
    const numParticles = 60; // Fewer particles
    const TWO_PI = Math.PI * 2;

    // Orange brand color
    const ORANGE = { r: 249, g: 115, b: 22 }; // #f97316 (orange-500)

    // Helper functions
    const random = (min: number, max?: number) => {
      if (max === undefined) {
        max = min;
        min = 0;
      }
      return Math.random() * (max - min) + min;
    };

    const map = (value: number, start1: number, stop1: number, start2: number, stop2: number) => {
      return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
    };

    const dist = (x1: number, y1: number, z1: number, x2: number, y2: number, z2: number) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const dz = z2 - z1;
      return Math.sqrt(dx * dx + dy * dy + dz * dz);
    };

    interface HelixPoint {
      x: number;
      y: number;
      z: number;
      strength: number;
      size: number;
      opacity: number;
    }

    // HelixParticle - each point balanced between opposing forces
    class HelixParticle {
      phase: number;
      radius: number;
      yOffset: number;
      ySpeed: number;
      rotationSpeed: number;
      size: number;
      opacity: number;
      strength: number;

      constructor(initialPhase?: number) {
        this.phase = initialPhase || random(TWO_PI);
        this.radius = random(90, 110);
        this.yOffset = random(-300, 300);
        this.ySpeed = random(0.3, 0.6) * (Math.random() > 0.5 ? 1 : -1);
        this.rotationSpeed = random(0.005, 0.0075);
        this.size = random(3, 6); // Slightly larger points
        this.opacity = random(120, 180);
        this.strength = random(0.8, 1);
      }

      update(): HelixPoint {
        // Update position - success and failure are one movement
        this.phase += this.rotationSpeed * this.strength;
        this.yOffset += this.ySpeed;

        // Reset position if it goes off screen
        if (this.yOffset > 350) this.yOffset = -350;
        if (this.yOffset < -350) this.yOffset = 350;

        // Calculate 3D position (scale based on canvas size)
        const scale = Math.min(width, height) / 600;
        const x = width / 2 + Math.cos(this.phase) * this.radius * scale;
        const y = height / 2 + this.yOffset * scale;
        const z = Math.sin(this.phase) * this.radius * scale;

        // Store position for drawing and connections
        return { x, y, z, strength: this.strength, size: this.size, opacity: this.opacity };
      }
    }

    // Create helix particles - fewer points
    for (let i = 0; i < numParticles; i++) {
      const initialPhase = (i / numParticles) * TWO_PI * 3; // Create 3 full rotations
      particles.push(new HelixParticle(initialPhase));
    }

    // Frame rate control variables
    const targetFPS = 30;
    const frameInterval = 1000 / targetFPS;
    let lastFrameTime = 0;

    const animate = (currentTime: number) => {
      // Initialize lastFrameTime on first frame
      if (!lastFrameTime) {
        lastFrameTime = currentTime;
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const deltaTime = currentTime - lastFrameTime;

      // Only render a new frame when enough time has passed (frame rate limiting)
      if (deltaTime >= frameInterval) {
        // Calculate remainder to prevent drift
        const remainder = deltaTime % frameInterval;

        // Update lastFrameTime with the time that's been processed
        lastFrameTime = currentTime - remainder;

        // Clear background (transparent)
        ctx.clearRect(0, 0, width, height);

        time += 0.02;

        // Update helix points
        helixPoints = particles.map(particle => particle.update());

        // Find balance between foreground and background, like hope and fear
        helixPoints.sort((a, b) => a.z - b.z);

        // Draw stronger connections between helix points
        ctx.lineWidth = 1.2; // Thicker lines

        const scale = Math.min(width, height) / 600;

        // Connect helix points to create a strand structure
        for (let i = 0; i < helixPoints.length; i++) {
          const hp1 = helixPoints[i];

          // Connect to nearby points
          for (let j = 0; j < helixPoints.length; j++) {
            if (i !== j) {
              const hp2 = helixPoints[j];
              const d = dist(hp1.x, hp1.y, hp1.z, hp2.x, hp2.y, hp2.z);

              // Create more connections with a larger distance threshold
              if (d < 120 * scale) {
                // Calculate opacity based on distance and z-position (depth)
                const opacity = map(d, 0, 120 * scale, 40, 10) *
                              map(Math.min(hp1.z, hp2.z), -110 * scale, 110 * scale, 0.3, 1);

                ctx.strokeStyle = `rgba(${ORANGE.r}, ${ORANGE.g}, ${ORANGE.b}, ${opacity / 255})`;
                ctx.beginPath();
                ctx.moveTo(hp1.x, hp1.y);
                ctx.lineTo(hp2.x, hp2.y);
                ctx.stroke();
              }
            }
          }
        }

        // Draw helix points with size based on z-position for 3D effect
        for (let i = 0; i < helixPoints.length; i++) {
          const hp = helixPoints[i];
          // Calculate size and opacity based on z-position (depth)
          const sizeMultiplier = map(hp.z, -110 * scale, 110 * scale, 0.6, 1.3);
          const adjustedOpacity = map(hp.z, -110 * scale, 110 * scale, hp.opacity * 0.4, hp.opacity);

          ctx.fillStyle = `rgba(${ORANGE.r}, ${ORANGE.g}, ${ORANGE.b}, ${adjustedOpacity / 255})`;
          ctx.beginPath();
          ctx.arc(hp.x, hp.y, (hp.size * sizeMultiplier * scale) / 2, 0, TWO_PI);
          ctx.fill();
        }

        // Create spinal connections - stronger central structure
        ctx.strokeStyle = `rgba(${ORANGE.r}, ${ORANGE.g}, ${ORANGE.b}, 0.118)`; // 30/255 ≈ 0.118
        ctx.lineWidth = 2 * scale;

        // Sort by y position for the spine
        const sortedByY = [...helixPoints].sort((a, b) => a.y - b.y);

        // Draw spine connecting points with similar y positions
        for (let i = 0; i < sortedByY.length - 1; i++) {
          const p1 = sortedByY[i];
          const p2 = sortedByY[i + 1];

          // Only connect if they're close in y position
          if (Math.abs(p1.y - p2.y) < 30 * scale) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // Request next frame
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Start the animation immediately with proper frame timing
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (canvas && ctx) {
        ctx.clearRect(0, 0, width, height);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full flex items-center justify-center">
      <canvas ref={canvasRef} className="max-w-full" />
    </div>
  );
};

export default Artwork33;
