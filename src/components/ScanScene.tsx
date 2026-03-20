"use client";

export default function ScanScene() {
  return (
    <div className="scan-overlay absolute inset-0 flex flex-col items-center justify-end pb-32 opacity-0 pointer-events-none">
      <p className="font-mono text-sm text-cyan-400 tracking-[0.3em] uppercase mb-2">
        Candidate scoring in sequence
      </p>
      <h2 className="text-2xl text-white font-light tracking-wide text-center max-w-2xl">
        Each resume is scanned, scored, and cleared before the final decision.
      </h2>
    </div>
  );
}
