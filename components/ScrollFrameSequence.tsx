'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface Props {
  frameCount: number;
  framePath: (index: number) => string;
  scrollHeight?: string;
  children?: React.ReactNode;
  className?: string;
}

export default function ScrollFrameSequence({
  frameCount,
  framePath,
  scrollHeight = '300vh',
  children,
  className,
}: Props) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Cache the 2D context — avoids repeated getContext() calls on every frame draw
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>(
    Array.from({ length: frameCount }, () => null)
  );
  const currentFrameRef = useRef(0);
  const rafIdRef = useRef(0);
  // Always-current reference to framePath so effects don't need it as a dep
  const framePathRef = useRef(framePath);
  useEffect(() => { framePathRef.current = framePath; });

  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);

  // Draw a frame using cached context and cover-scaling
  const drawFrame = useCallback((index: number) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    const img = imagesRef.current[index];
    if (!canvas || !ctx || !img || !img.complete || img.naturalWidth === 0) return;

    const { width: cW, height: cH } = canvas;
    const { naturalWidth: iW, naturalHeight: iH } = img;
    const scale = Math.max(cW / iW, cH / iH);
    const dW = iW * scale;
    const dH = iH * scale;

    ctx.clearRect(0, 0, cW, cH);
    ctx.drawImage(img, (cW - dW) / 2, (cH - dH) / 2, dW, dH);
  }, []); // intentionally empty — only touches refs

  // Match canvas bitmap to its rendered size; re-acquire context after each resize.
  // (canvas state resets when width/height attributes change)
  // Bitmap is scaled by devicePixelRatio (capped at 2) so the image stays sharp on
  // Retina/HiDPI displays. drawFrame uses canvas.width/height directly, so the
  // cover-scale math automatically operates at full bitmap resolution.
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const cssW = canvas.clientWidth || window.innerWidth;
      const cssH = canvas.clientHeight || window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(cssW * dpr);
      const h = Math.round(cssH * dpr);

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctxRef.current = ctx;
      }

      drawFrame(currentFrameRef.current);
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });
    return () => window.removeEventListener('resize', resize);
  }, [drawFrame]);

  // Kick off preloading; hide loading screen the moment frame 0 is ready
  useEffect(() => {
    imagesRef.current = Array.from({ length: frameCount }, () => null);
    let loadedCount = 0;

    const onLoaded = (i: number) => () => {
      loadedCount++;
      setLoadProgress(Math.round((loadedCount / frameCount) * 100));
      if (i === 0) {
        drawFrame(0);
        setLoading(false);
      }
    };

    for (let i = 0; i < frameCount; i++) {
      const img = new Image();
      imagesRef.current[i] = img;
      img.onload = onLoaded(i);
      img.onerror = onLoaded(i);
      img.src = framePathRef.current(i);
    }

    // Safety valve — never leave loading screen up for more than 5 s
    const fallback = setTimeout(() => setLoading(false), 5000);
    return () => clearTimeout(fallback);
  }, [frameCount, drawFrame]);

  // Scroll → frame mapping via RAF (one pending RAF at a time)
  useEffect(() => {
    let pending = false;

    const onScroll = () => {
      if (pending) return;
      pending = true;
      rafIdRef.current = requestAnimationFrame(() => {
        pending = false;
        const section = sectionRef.current;
        if (!section) return;

        const rect = section.getBoundingClientRect();
        const scrollable = section.offsetHeight - window.innerHeight;
        if (scrollable <= 0) return;

        const scrolled = Math.max(0, -rect.top);
        const progress = Math.min(1, scrolled / scrollable);
        const frame = Math.min(
          frameCount - 1,
          Math.floor(progress * frameCount)
        );

        if (frame !== currentFrameRef.current) {
          currentFrameRef.current = frame;
          drawFrame(frame);
        }
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafIdRef.current);
    };
  }, [frameCount, drawFrame]);

  return (
    <section
      ref={sectionRef}
      style={{ height: scrollHeight }}
      className={`relative${className ? ` ${className}` : ''}`}
    >
      {/* Sticky viewport — fills screen while outer section scrolls */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          aria-hidden="true"
        />

        {children}

        {/* Loading overlay — fades out once first frame is ready */}
        <div
          className={`absolute inset-0 bg-zinc-950 z-50 flex flex-col items-center justify-center transition-opacity duration-700 ${
            loading ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          aria-hidden={!loading}
        >
          <div className="flex items-center gap-3 mb-10">
            <div
              className="w-5 h-5 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin"
              aria-hidden="true"
            />
            <span className="text-lg font-black tracking-[0.35em] text-white uppercase">
              JILBER
            </span>
          </div>

          <div className="w-48 h-0.5 bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-cyan-400 transition-[width] duration-300"
              style={{ width: `${loadProgress}%` }}
              role="progressbar"
              aria-valuenow={loadProgress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>

          <p className="text-[10px] text-zinc-600 tracking-[0.3em] uppercase mt-3">
            Loading {loadProgress}%
          </p>
        </div>
      </div>
    </section>
  );
}
