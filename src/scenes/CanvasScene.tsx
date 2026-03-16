"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import ResumeCloud from "./ResumeCloud";
import SkillsScene from "./SkillsScene";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";

interface CanvasSceneProps {
  masterProgressRef?: React.MutableRefObject<{ value: number }>;
}

// Inner component that derives phase-specific progress values from the master
function SceneOrchestrator({ masterProgressRef }: { masterProgressRef: React.MutableRefObject<{ value: number }> }) {
  // Derived progress refs for each sub-scene
  const scanProgressRef = useRef({ value: 0 });
  const portfolioProgressRef = useRef({ value: 0 });
  const skillsProgressRef = useRef({ value: 0 });

  useFrame(() => {
    const p = masterProgressRef.current.value;

    // Map master progress into phase-specific 0-1 ranges
    // 0.25 - 0.45 → AI scan
    scanProgressRef.current.value = Math.min(Math.max((p - 0.25) / 0.20, 0), 1);

    // 0.60 - 0.75 → Portfolio (calming the scene)
    portfolioProgressRef.current.value = Math.min(Math.max((p - 0.45) / 0.15, 0), 1);

    // 0.75 - 0.88 → Skills
    skillsProgressRef.current.value = Math.min(Math.max((p - 0.75) / 0.13, 0), 1);
  });

  return (
    <>
      <ResumeCloud
        scanProgressRef={scanProgressRef}
        portfolioProgressRef={portfolioProgressRef}
      />
      <SkillsScene progressRef={skillsProgressRef} />
    </>
  );
}

export default function CanvasScene({ masterProgressRef }: CanvasSceneProps) {
  const defaultRef = useRef({ value: 0 });
  const activeRef = masterProgressRef || defaultRef;

  return (
    <div className="w-full h-full pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 15], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
      >
        <Suspense fallback={null}>
          <SceneOrchestrator masterProgressRef={activeRef} />
        </Suspense>
      </Canvas>
    </div>
  );
}
