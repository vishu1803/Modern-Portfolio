"use client";

/**
 * SmoothScroll — Lenis smooth scrolling synced with GSAP ScrollTrigger.
 *
 * - Lenis RAF is driven by gsap.ticker (shared frame timing)
 * - Lenis scroll events feed ScrollTrigger.update
 * - Respects prefers-reduced-motion for accessibility
 * - Cleanup handles both normal and reduced-motion paths safely
 */

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register once here — all other files import ScrollTrigger directly
gsap.registerPlugin(ScrollTrigger);

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Respect prefers-reduced-motion from the start
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      // No smooth scrolling — native scroll works fine with GSAP
      return;
    }

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
      infinite: false,
    });

    lenisRef.current = lenis;

    // Sync: Lenis scroll → ScrollTrigger recalculates
    lenis.on("scroll", ScrollTrigger.update);

    // Drive Lenis from GSAP's ticker (shared timing)
    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    // Runtime reduced-motion change
    const handleMotionChange = (e: MediaQueryListEvent) => {
      if (e.matches && lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
    };
    mediaQuery.addEventListener("change", handleMotionChange);

    return () => {
      gsap.ticker.remove(tickerCallback);
      mediaQuery.removeEventListener("change", handleMotionChange);
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
    };
  }, []);

  return <>{children}</>;
}
