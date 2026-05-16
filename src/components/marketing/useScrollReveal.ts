'use client';

import { useEffect } from 'react';

/** Adds `.in` to every `.reveal`, `.reveal-zoom`, `.reveal-left` when they enter the viewport. */
export function useScrollReveal() {
  useEffect(() => {
    const items = document.querySelectorAll('.reveal, .reveal-zoom, .reveal-left');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}
