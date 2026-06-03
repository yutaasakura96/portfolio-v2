"use client";

import { useEffect, useRef, useState } from "react";

export function useReveal(options?: { margin?: string; once?: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (options?.once !== false) observer.unobserve(el);
        }
      },
      { rootMargin: options?.margin ?? "-80px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [options?.margin, options?.once]);

  return { ref, visible };
}
