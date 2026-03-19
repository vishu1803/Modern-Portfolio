"use client";

/**
 * PortfolioReveal — The "identity card" that appears when the
 * selected resume morphs into a clean portfolio interface.
 *
 * Visibility is controlled entirely by the master GSAP timeline
 * in page.tsx; this component is purely presentational.
 */
export default function PortfolioReveal() {
  return (
    <div className="max-w-4xl w-full">
      <div className="reveal-content backdrop-blur-md bg-white/5 border border-white/10 p-12 md:p-16 rounded-[2rem] shadow-2xl relative overflow-hidden">

        {/* Subtle gradient glow behind the card */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2" />

        <p className="text-cyan-400 font-mono text-sm md:text-base tracking-widest uppercase mb-6">
          // Profile Loaded
        </p>

        <h2 className="text-4xl md:text-7xl font-bold mb-6 text-white tracking-tight">
          Hi, I&apos;m <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Alex</span>.
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
