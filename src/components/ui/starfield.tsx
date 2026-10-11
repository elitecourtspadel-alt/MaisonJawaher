'use client';
import { useEffect, useRef } from 'react';

type Star = { x: number; y: number; r: number; a: number; s: number; p: number };
type Shot = { x: number; y: number; vx: number; vy: number; life: number; len: number };

/**
 * Twinkling stars with the odd shooting star. Dark mode only: in light mode the canvas is not displayed
 * (and does no work). Also pauses off-screen and when the visitor prefers reduced motion.
 */
export function Starfield({ className = '', density = 1, viewport = false }: { className?: string; density?: number; viewport?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const root = document.documentElement;
    let w = 0, h = 0, raf = 0, visible = true, stars: Star[] = [], shots: Shot[] = [], nextShot = 1500;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      if (!w || !h) return;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round((w * h) / 5500 * density);
      stars = Array.from({ length: Math.min(n, 260) }, () => ({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.2 + 0.25, a: Math.random() * 0.6 + 0.25, s: Math.random() * 1.4 + 0.4, p: Math.random() * 6.28 }));
    };

    let last = performance.now();
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      const dark = root.classList.contains('dark');
      if (!visible || !dark || !w) { last = now; if (!dark) ctx.clearRect(0, 0, w, h); return; }
      const dt = now - last; last = now;
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const tw = reduce ? 1 : 0.55 + 0.45 * Math.sin(now / 1000 * s.s + s.p);
        ctx.fillStyle = `rgba(244,233,220,${s.a * tw})`;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
      }
      if (reduce) return;
      nextShot -= dt;
      if (nextShot <= 0) {
        nextShot = 2200 + Math.random() * 4200;
        const ang = (Math.PI / 180) * (20 + Math.random() * 25);
        const sp = 0.55 + Math.random() * 0.4;
        shots.push({ x: Math.random() * w * 0.8, y: Math.random() * h * 0.45, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 1, len: 90 + Math.random() * 90 });
      }
      shots = shots.filter((s) => s.life > 0);
      for (const s of shots) {
        s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt / 1100;
        const m = Math.hypot(s.vx, s.vy);
        const tx = s.x - (s.vx / m) * s.len, ty = s.y - (s.vy / m) * s.len;
        const g = ctx.createLinearGradient(s.x, s.y, tx, ty);
        g.addColorStop(0, `rgba(241,217,155,${Math.max(s.life, 0)})`);
        g.addColorStop(1, 'rgba(241,217,155,0)');
        ctx.strokeStyle = g; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(tx, ty); ctx.stroke();
        ctx.fillStyle = `rgba(255,248,230,${Math.max(s.life, 0)})`;
        ctx.beginPath(); ctx.arc(s.x, s.y, 1.6, 0, 6.283); ctx.fill();
      }
    };

    const ro = new ResizeObserver(resize); ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }); io.observe(canvas);
    resize(); raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); };
  }, [density]);

  return <canvas ref={ref} aria-hidden className={`pointer-events-none ${viewport ? 'fixed z-0' : 'absolute'} inset-0 hidden size-full dark:block ${className}`} />;
}
