'use client';

import { useState, useEffect, useRef } from 'react';

interface Props {
  to:       number;
  duration?: number;
  suffix?:  string;
  prefix?:  string;
  decimals?: number;
}

export function CountUp({ to, duration = 1400, suffix = '', prefix = '', decimals }: Props) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const start = performance.now();
            const animate = (now: number) => {
              const t = Math.min(1, (now - start) / duration);
              const eased = 1 - Math.pow(1 - t, 3);
              setVal(to * eased);
              if (t < 1) requestAnimationFrame(animate);
            };
            requestAnimationFrame(animate);
            io.disconnect();
          }
        });
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration]);

  const d = decimals ?? (Number.isInteger(to) ? 0 : 1);
  const display = val.toFixed(d);

  return <span ref={ref}>{prefix}{display}{suffix}</span>;
}
