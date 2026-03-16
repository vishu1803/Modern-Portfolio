"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CanvasScene from "@/scenes/CanvasScene";
import PortfolioReveal from "@/components/PortfolioReveal";
import ProjectsScene from "@/components/ProjectsScene";
import ExperienceContactScene from "@/components/ExperienceContactScene";

gsap.registerPlugin(ScrollTrigger);

/*
  Master Timeline Phase Map:
  0.00 - 0.25  Resume Cloud (floating resumes visible)
  0.25 - 0.45  AI Scan (beam sweeps through)
  0.45 - 0.60  Selected Resume (one resume comes to front)
  0.60 - 0.75  Portfolio Reveal (HTML identity card fades in)
  0.75 - 0.88  Skills (3D skill nodes)
  0.88 - 0.96  Projects (project cards)
  0.96 - 1.00  Contact (experience + contact links)
*/

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const masterProgressRef = useRef({ value: 0 });

  useEffect(() => {
    const ctx = gsap.context(() => {

      // Master pinned timeline
      const masterTl = gsap.timeline({
        scrollTrigger: {
          trigger: ".story-pinned",
          start: "top top",
          end: "+=600%", // 6 screen-heights worth of scroll
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        }
      });

      // Drive the master progress value from 0 to 1 across the full timeline
      masterTl.to(masterProgressRef.current, { value: 1, duration: 1, ease: "none" }, 0);

      // --- Phase 0.00 - 0.25: Resume Cloud ---
      // Hero text is visible, then fades out
      masterTl.to(".hero-content", { opacity: 0, y: -60, duration: 0.2, ease: "power2.in" }, 0.15);

      // --- Phase 0.25 - 0.45: AI Scan ---
      // Scanning text appears
      masterTl.fromTo(".scan-overlay",
        { opacity: 0 },
        { opacity: 1, duration: 0.05, ease: "none" },
        0.25
      );
      masterTl.to(".scan-overlay", { opacity: 0, duration: 0.05, ease: "none" }, 0.42);

      // --- Phase 0.45 - 0.60: Selected Resume ---
      // "Match found" text
      masterTl.fromTo(".match-overlay",
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.08, ease: "power2.out" },
        0.48
      );
      masterTl.to(".match-overlay", { opacity: 0, duration: 0.05 }, 0.58);

      // --- Phase 0.60 - 0.75: Portfolio Reveal ---
      masterTl.fromTo(".portfolio-overlay",
        { opacity: 0, y: 60 },
        { opacity: 1, y: 0, duration: 0.1, ease: "power2.out" },
        0.60
      );
      masterTl.to(".portfolio-overlay", { opacity: 0, y: -40, duration: 0.05 }, 0.73);

      // --- Phase 0.75 - 0.88: Skills ---
      masterTl.fromTo(".skills-overlay",
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.08, ease: "power2.out" },
        0.75
      );
      masterTl.to(".skills-overlay", { opacity: 0, y: -30, duration: 0.05 }, 0.86);

      // --- Phase 0.88 - 0.96: Projects ---
      masterTl.fromTo(".projects-overlay",
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.06, ease: "power2.out" },
        0.88
      );
      masterTl.to(".projects-overlay", { opacity: 0, y: -30, duration: 0.03 }, 0.94);

      // --- Phase 0.96 - 1.00: Contact ---
      masterTl.fromTo(".contact-overlay",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.04, ease: "power2.out" },
        0.96
      );

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <main ref={containerRef} className="relative w-full bg-transparent text-gray-100">

      {/* Fixed 3D Canvas Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <CanvasScene masterProgressRef={masterProgressRef} />
      </div>

      {/* Pinned Storytelling Container */}
      <div className="story-pinned relative z-10 w-full h-screen overflow-hidden">

        {/* Phase 1: Resume Cloud — Hero Text */}
        <div className="hero-content absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-8xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-br from-white via-gray-300 to-gray-700">
              The Search Ends Here.
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 font-light tracking-wide leading-relaxed">
              An AI scans through thousands of resumes.
              <span className="block mt-4 text-white font-medium">One is selected. This is their story.</span>
            </p>
          </div>
        </div>

        {/* Phase 2: AI Scan Overlay */}
        <div className="scan-overlay absolute inset-0 flex items-end justify-center pb-32 opacity-0 pointer-events-none">
          <div className="text-center">
            <p className="font-mono text-sm text-cyan-400 tracking-widest uppercase animate-pulse">
              Scanning candidate database...
            </p>
            <div className="mt-4 w-64 h-0.5 bg-gray-800 rounded-full overflow-hidden mx-auto">
              <div className="w-full h-full bg-cyan-400/60 origin-left animate-[pulse_2s_infinite]" />
            </div>
          </div>
        </div>

        {/* Phase 3: Match Found */}
        <div className="match-overlay absolute inset-0 flex items-center justify-center opacity-0 pointer-events-none">
          <div className="text-center">
            <p className="font-mono text-cyan-400 text-sm tracking-widest uppercase mb-4">// Match Found</p>
            <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tight">99.9%</h2>
            <p className="text-gray-400 mt-4 text-lg font-light">Candidate identified.</p>
          </div>
        </div>

        {/* Phase 4: Portfolio Reveal */}
        <div className="portfolio-overlay absolute inset-0 flex items-center justify-center px-6 opacity-0">
          <PortfolioReveal />
        </div>

        {/* Phase 5: Skills */}
        <div className="skills-overlay absolute inset-0 flex items-center justify-center opacity-0 pointer-events-none">
          {/* 3D SkillsScene renders in the canvas — this is just a label */}
        </div>

        {/* Phase 6: Projects */}
        <div className="projects-overlay absolute inset-0 flex items-center justify-center px-6 opacity-0">
          <ProjectsScene />
        </div>

        {/* Phase 7: Contact */}
        <div className="contact-overlay absolute inset-0 flex items-center justify-center px-6 opacity-0">
          <ExperienceContactScene />
        </div>

      </div>
    </main>
  );
}
