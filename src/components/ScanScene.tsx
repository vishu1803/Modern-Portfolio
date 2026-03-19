"use client";

export default function ScanScene() {
  return (
    <div className="scan-overlay absolute inset-0 flex flex-col items-center justify-end pb-32 opacity-0 pointer-events-none">
      <p className="font-mono text-sm text-cyan-500 tracking-[0.3em] uppercase mb-2">
        // Processing
      </p>
      <h2 className="text-2xl text-white font-light tracking-wide animate-pulse">
        Evaluating candidate data.
      </h2>
    </div>
  );
}
