"use client";

import { useEffect, useRef, useState } from "react";

const FRAME_COUNT = 169;
const FRAME_PATH = (i: number) => `/hero-frames/frame_${String(i).padStart(4, "0")}.jpg`;

/**
 * Scroll-controlled video using a canvas + image sequence.
 *
 * Unlike <video> with currentTime scrubbing (which stutters because browsers
 * only seek to keyframes), this paints pre-extracted JPEG frames to a canvas
 * based on scroll position. Smooth forward AND reverse scrubbing, no stutter.
 *
 * The user's scroll position within the parent section drives which frame
 * is displayed. When they scroll past the section, frames stop updating.
 */
export default function ScrollVideo({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const currentFrameRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Preload all frames
  useEffect(() => {
    let cancelled = false;
    let loadedCount = 0;
    const images: HTMLImageElement[] = [];

    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      img.src = FRAME_PATH(i);
      img.onload = () => {
        loadedCount++;
        // Mark ready after the first frame so we can paint immediately,
        // then keep loading the rest in the background
        if (loadedCount === 1 && !cancelled) {
          setLoaded(true);
          drawFrame(0);
        }
      };
      images.push(img);
    }
    imagesRef.current = images;

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Draw a specific frame to the canvas
  const drawFrame = (frameIndex: number) => {
    const canvas = canvasRef.current;
    const img = imagesRef.current[frameIndex];
    if (!canvas || !img || !img.complete) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to match display size (DPR-aware)
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }

    // Draw image with object-cover behavior
    const imgRatio = img.width / img.height;
    const canvasRatio = canvas.width / canvas.height;
    let drawWidth = canvas.width;
    let drawHeight = canvas.height;
    let offsetX = 0;
    let offsetY = 0;

    if (imgRatio > canvasRatio) {
      // Image wider than canvas — crop sides
      drawWidth = canvas.height * imgRatio;
      offsetX = (canvas.width - drawWidth) / 2;
    } else {
      // Image taller than canvas — crop top/bottom
      drawHeight = canvas.width / imgRatio;
      offsetY = (canvas.height - drawHeight) / 2;
    }

    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  };

  // Scroll → frame mapping (tracks full document scroll, not a specific section)
  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Document-wide scroll progress: 0 at top, 1 at bottom
        const scrollY = window.scrollY;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const progress = maxScroll > 0 ? Math.max(0, Math.min(1, scrollY / maxScroll)) : 0;

        const targetFrame = Math.min(
          FRAME_COUNT - 1,
          Math.floor(progress * FRAME_COUNT)
        );

        if (targetFrame !== currentFrameRef.current) {
          currentFrameRef.current = targetFrame;
          drawFrame(targetFrame);
        }
      });
    };

    const handleResize = () => {
      drawFrame(currentFrameRef.current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);
    // Initial paint
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [loaded]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
    />
  );
}
