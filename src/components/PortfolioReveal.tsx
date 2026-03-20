"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface PortfolioRevealProps {
  isVisible: boolean;
  isExit: boolean;
}

/**
 * PortfolioReveal — The "identity card" that appears when the
 * selected resume morphs into a clean portfolio interface.
 *
 * Visibility is natively decoupled from scrolling, 
 * rendering autonomously to allow authentic absolute delays.
 */
export default function PortfolioReveal({ isVisible, isExit }: PortfolioRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (isVisible && !isExit) {
      // Automatic 0.8s pause, then beautiful cinematic reveal independently without scroll scrubbing
      gsap.fromTo(containerRef.current,
        { opacity: 0, y: 80, filter: "blur(20px)", scale: 0.9 },
        { opacity: 1, y: 0, filter: "blur(0px)", scale: 1, duration: 1.2, delay: 0.8, ease: "power3.out" }
      );
      // Restore native interactions purely via time offset
      gsap.set(containerRef.current, { pointerEvents: "auto", delay: 1.0 });
    } else if (isExit) {
      // Scrubbed-equivalent exit behavior matching the timeline boundaries securely
      gsap.to(containerRef.current, 
        { opacity: 0, y: -40, filter: "blur(15px)", scale: 1.05, duration: 0.4, ease: "power2.in" }
      );
      gsap.set(containerRef.current, { pointerEvents: "none" });
    } else {
      // Hidden default baseline
      gsap.set(containerRef.current, { opacity: 0, pointerEvents: "none" });
    }
  }, [isVisible, isExit]);

  return (
    <div ref={containerRef} className="max-w-4xl w-full opacity-0 pointer-events-none">
      <div className="reveal-content backdrop-blur-md bg-white/5 border border-white/10 p-12 md:p-16 rounded-[2rem] shadow-2xl relative overflow-hidden">

        {/* Subtle gradient glow behind the card */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2" />

        <p className="text-cyan-400 font-mono text-sm md:text-base tracking-widest uppercase mb-6">
          Profile Loaded
        </p>

        <h2 className="text-4xl md:text-7xl font-bold mb-6 text-white tracking-tight">
          Hi, I&apos;m <span className="text-cyan-400">Alex</span>.
        </h2>

        <p className="text-xl md:text-3xl text-gray-300 font-light leading-relaxed mb-12 max-w-2xl">
          A creative developer obsessed with building immersive, high-performance web experiences bridging design and engineering.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <button className="px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-gray-200 transition-colors">
            View Work
          </button>
          <button className="px-8 py-4 bg-white/10 text-white font-semibold rounded-full border border-white/20 hover:bg-white/20 transition-colors">
            Contact Me
          </button>
        </div>

      </div>
    </div>
  );
}
