"use client";

/**
 * page.tsx — Master page with a single pinned GSAP ScrollTrigger timeline.
 *
 * Phase Map:
 *   0.00 – 0.25  Resume Cloud (hero text + floating resumes)
 *   0.25 – 0.45  AI Scan (beam sweeps)
 *   0.45 – 0.60  Selected Resume (match found)
 *   0.60 – 0.75  Portfolio Reveal (identity card)
 *   0.75 – 0.90  Skills + Projects
 *   0.90 – 1.00  Contact
 */

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ResumeScene from "@/components/ResumeScene";
import ScanScene from "@/components/ScanScene";
import SelectedScene from "@/components/SelectedScene";
import PortfolioReveal from "@/components/PortfolioReveal";
import ProjectsScene from "@/components/ProjectsScene";
import ContactScene from "@/components/ContactScene";

// Register at module scope so it's available before any useEffect runs
gsap.registerPlugin(ScrollTrigger);

// Dynamic import avoids SSR for the Three.js canvas (prevents hydration mismatch)
const CanvasScene = dynamic(() => import("@/scenes/CanvasScene"), { ssr: false });

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const masterProgressRef = useRef({ value: 0 });

  useEffect(() => {
    const ctx = gsap.context(() => {

      // ─── Master pinned timeline ─────────────────────────────
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: ".story-pinned",
          start: "top top",
          end: "+=800%",
          pin: true,
          scrub: 2.5, // Cinematic heavy scrubbing
          anticipatePin: 1,
        },
      });

      // Drive master progress 0 → 1
      tl.to(masterProgressRef.current, { value: 1, duration: 1, ease: "none" }, 0);

      // ─── 0–15%: Resume Scene ────────────────────────────
      tl.to(".hero-content", {
        opacity: 0, y: -40, filter: "blur(16px)", scale: 0.95, duration: 0.03, ease: "power2.inOut",
      }, 0.12); // Fades out just before 15%

      // ─── 15–35%: Scan Scene ─────────────────────────────
      tl.fromTo(".scan-overlay",
        { opacity: 0, y: 20, filter: "blur(10px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.03, ease: "power2.out" }, 0.15
      );
      tl.to(".scan-overlay", { opacity: 0, y: -20, filter: "blur(10px)", duration: 0.03, ease: "power2.in" }, 0.32);
      
      // --- PAUSE: 35% to 38% (Total silence, only the glowing 3D target is visible) ---

      // ─── 38–47%: Selected Scene ─────────────────────────
      tl.fromTo(".match-overlay",
        { opacity: 0, scale: 1.1, filter: "blur(20px)" },
        { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.03, ease: "power2.out" }, 0.38
      );
      tl.to(".match-overlay", { opacity: 0, scale: 0.95, filter: "blur(10px)", duration: 0.03, ease: "power2.in" }, 0.47);

      // --- PAUSE: 47% to 53% (Silence, 3D Camera physically zooms into the target violently) ---

      // ─── 53–65%: Portfolio Reveal ───────────────────────
      tl.fromTo(".portfolio-overlay",
        { opacity: 0, y: 60, filter: "blur(20px)", scale: 0.95 },
        { opacity: 1, y: 0, filter: "blur(0px)", scale: 1, duration: 0.03, ease: "power2.out" }, 0.53
      );
      tl.to(".portfolio-overlay", { opacity: 0, y: -40, filter: "blur(15px)", scale: 1.05, duration: 0.03, ease: "power2.in" }, 0.62);

      // ─── 65–80%: Skills Visible ─────────────────────────
      tl.fromTo(".skills-overlay",
        { opacity: 0, y: 40, filter: "blur(15px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.03, ease: "power2.out" }, 0.65
      );
      tl.to(".skills-overlay", { opacity: 0, y: -40, filter: "blur(10px)", duration: 0.03, ease: "power2.in" }, 0.77);

      // ─── 80–92%: Projects Visible ───────────────────────
      tl.fromTo(".projects-overlay",
        { opacity: 0, y: 40, filter: "blur(15px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.03, ease: "power2.out" }, 0.80
      );
      tl.to(".projects-overlay", { opacity: 0, y: -40, filter: "blur(10px)", duration: 0.03, ease: "power2.in" }, 0.89);

      // ─── 92–100%: Contact Visible ───────────────────────
      tl.fromTo(".contact-overlay",
        { opacity: 0, y: 40, filter: "blur(15px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.03, ease: "power2.out" }, 0.92
      );

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <main ref={containerRef} className="relative w-full bg-transparent text-gray-100">

      {/* Fixed 3D Canvas Layer (SSR-disabled) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <CanvasScene masterProgressRef={masterProgressRef} />
      </div>

      {/* Pinned Storytelling Container */}
      <div className="story-pinned relative z-10 w-full h-screen overflow-hidden">

        {/* Phase 1: Hero Text */}
        <ResumeScene />

        {/* Phase 2: AI Scan */}
        <ScanScene />

        {/* Phase 3: Match Found */}
        <SelectedScene />

        {/* Phase 4: Portfolio Reveal */}
        <div className="portfolio-overlay absolute inset-0 flex items-center justify-center px-6 opacity-0 pointer-events-none">
          <PortfolioReveal />
        </div>

        {/* Phase 5: Skills (3D renders in canvas — this is overlay-only) */}
        <div className="skills-overlay absolute inset-0 flex flex-col items-center justify-end pb-32 opacity-0 pointer-events-none">
          <p className="font-mono text-sm text-gray-500 tracking-[0.3em] uppercase mb-2">
            // Architecture
          </p>
          <h2 className="text-2xl text-white font-light tracking-wide">
            Core Competencies.
          </h2>
        </div>

        {/* Phase 6: Projects */}
        <div className="projects-overlay absolute inset-0 flex items-center justify-center px-6 opacity-0">
          <ProjectsScene />
        </div>

        {/* Phase 7: Contact */}
        <div className="contact-overlay absolute inset-0 flex items-center justify-center px-6 opacity-0">
          <ContactScene />
        </div>

      </div>
    </main>
  );
}
