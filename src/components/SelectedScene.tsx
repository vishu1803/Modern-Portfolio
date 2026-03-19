"use client";

export default function SelectedScene() {
  return (
    <div className="match-overlay absolute inset-0 flex flex-col items-center justify-center opacity-0 pointer-events-none">
      <p className="font-mono text-cyan-300 text-sm tracking-[0.4em] uppercase mb-6">
        Match Found
      </p>
      <h2 className="text-6xl md:text-8xl font-light text-white tracking-tighter">
        99.9%
      </h2>
      <p className="text-gray-500 mt-6 text-lg font-light tracking-wide">
        Unprecedented synergy.
      </p>
    </div>
  );
}
