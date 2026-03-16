"use client";

import { useRef, useLayoutEffect } from "react";
import gsap from "gsap";

export default function PortfolioReveal() {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // The reveal animation when this section comes into view
      // We will trigger this from the parent page.tsx ScrollTrigger
      
      gsap.from(".reveal-item", {
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top center+=100",
          end: "center center",
          scrub: true,
        },
        y: 50,
        opacity: 0,
        stagger: 0.1,
        ease: "power2.out"
      });
      
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="portfolio-reveal-container min-h-screen flex items-center justify-center px-6 relative z-10 w-full pt-[20vh] pb-[20vh]">
      <div className="max-w-4xl w-full">
        {/* The clean HTML Portfolio Interface */}
        <div className="reveal-content backdrop-blur-md bg-white/5 border border-white/10 p-12 md:p-16 rounded-[2rem] shadow-2xl relative overflow-hidden">
          
          {/* Subtle gradient glow behind the card */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2" />
          
          <p className="reveal-item text-cyan-400 font-mono text-sm md:text-base tracking-widest uppercase mb-6">
            // Profile Loaded
          </p>
          
          <h2 className="reveal-item text-4xl md:text-7xl font-bold mb-6 text-white tracking-tight">
            Hi, I'm <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Alex</span>.
          </h2>
          
          <p className="reveal-item text-xl md:text-3xl text-gray-300 font-light leading-relaxed mb-12 max-w-2xl">
            A creative developer obsessed with building immersive, high-performance web experiences bridging design and engineering.
          </p>
          
          <div className="reveal-item flex flex-col sm:flex-row gap-4">
            <button className="px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-gray-200 transition-colors">
              View Work
            </button>
            <button className="px-8 py-4 bg-white/10 text-white font-semibold rounded-full border border-white/20 hover:bg-white/20 transition-colors">
              Contact Me
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
}
