"use client";

import { useRef, useCallback, ReactNode } from "react";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  href?: string;
}

export default function TiltCard({ children, className = "", href }: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const card = cardRef.current;
    if (!card) return;

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    const clientX = e.clientX;
    const clientY = e.clientY;

    rafRef.current = requestAnimationFrame(() => {
      const rect = card.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -6;
      const rotateY = ((x - centerX) / centerX) * 6;

      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

      if (glowRef.current) {
        glowRef.current.style.background = `radial-gradient(300px circle at ${x}px ${y}px, rgba(168,85,247,0.15), transparent 60%)`;
        glowRef.current.style.opacity = "1";
      }

      rafRef.current = null;
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    card.style.transform = "perspective(800px) rotateX(0) rotateY(0) scale3d(1, 1, 1)";

    if (glowRef.current) {
      glowRef.current.style.opacity = "0";
    }
  }, []);

  const Tag = href ? "a" : "div";
  const linkProps = href ? { href } : {};

  return (
    <Tag {...linkProps} className="block">
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`relative transition-transform duration-200 ease-out will-change-transform ${className}`}
      >
        <div
          ref={glowRef}
          className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 pointer-events-none"
        />
        {children}
      </div>
    </Tag>
  );
}
