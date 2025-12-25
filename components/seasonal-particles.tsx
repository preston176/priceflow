"use client";

import { useEffect, useState } from "react";
import { getCurrentThemeConfig } from "@/lib/seasonal-theme";

interface Particle {
  id: number;
  emoji: string;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
}

export function SeasonalParticles() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const theme = getCurrentThemeConfig();

    if (!theme.particles?.emoji) return;

    const particleCount = theme.particles.count || 15;
    const emojis = theme.particles.emoji;

    const newParticles: Particle[] = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      x: Math.random() * 100, // % from left
      y: -10 - Math.random() * 20, // Start above viewport
      size: 0.8 + Math.random() * 1.2, // 0.8rem to 2rem
      duration: 10 + Math.random() * 15, // 10-25s fall time
      delay: Math.random() * 5, // 0-5s initial delay
      drift: -20 + Math.random() * 40, // -20% to 20% horizontal drift
    }));

    setParticles(newParticles);
  }, []);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute animate-fall opacity-60"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            fontSize: `${particle.size}rem`,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
            // @ts-ignore - CSS custom properties
            "--drift": `${particle.drift}%`,
          }}
        >
          {particle.emoji}
        </div>
      ))}

      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.6;
          }
          90% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(110vh) translateX(var(--drift)) rotate(360deg);
            opacity: 0;
          }
        }

        .animate-fall {
          animation: fall linear infinite;
        }
      `}</style>
    </div>
  );
}
