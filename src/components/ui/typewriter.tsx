'use client';
import { useEffect, useRef, useState } from 'react';

/** Types `text` character by character once it scrolls into view. Full text is always available to assistive tech. */
export function Typewriter({ text, speed = 85, delay = 250, className = '', href }: { text: string; speed?: number; delay?: number; className?: string; href?: string }) {
  const [n, setN] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setN(text.length); return; }
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setStarted(true), io.disconnect()), { threshold: 0.4 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [text]);

  useEffect(() => {
    if (!started) return;
    setN(0);
    let i = 0;
    let t: ReturnType<typeof setTimeout>;
    const tick = () => { i++; setN(i); if (i < text.length) t = setTimeout(tick, speed + Math.random() * 60); };
    t = setTimeout(tick, delay);
    return () => clearTimeout(t);
  }, [started, text, speed, delay]);

  const done = n >= text.length;
  const inner = (
    <>
      <span aria-hidden>{text.slice(0, n)}</span>
      <span aria-hidden className="ml-0.5 inline-block w-[0.08em] -mb-[0.1em] h-[1em] bg-accent align-baseline" style={{ animation: done ? 'caret 1s step-end infinite' : undefined }} />
      <span className="sr-only">{text}</span>
    </>
  );
  return <span ref={ref} className={`inline-block min-h-[1.2em] tabular-nums ${className}`}>{href ? <a href={href}>{inner}</a> : inner}</span>;
}
