"use client";

/**
 * CanvasScene — Root 3D canvas component.
 *
 * Contains a SceneOrchestrator that maps the master scroll progress
 * (0→1) into phase-specific progress values for each sub-scene.
 *
 * Phase mapping (matches page.tsx master timeline):
 *   0.00–0.25  Resume Cloud visible
 *   0.25–0.45  AI Scan beam sweeps
 *   0.45–0.60  Selected resume comes to front
 *   0.60–0.75  Portfolio reveal (scene calms)
 *   0.75–0.90  Skills nodes
 *   0.90–1.00  Projects + Contact (scene very calm)
 */

import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import * as THREE from "three";
import { EffectComposer, DepthOfField } from "@react-three/postprocessing";
import ResumeCloud from "./ResumeCloud";
import SkillsScene from "./SkillsScene";

interface CanvasSceneProps {
  masterProgressRef?: React.MutableRefObject<{ value: number }>;
}

function SceneOrchestrator({
  masterProgressRef,
}: {
  masterProgressRef: React.MutableRefObject<{ value: number }>;
}) {
  const scanProgressRef = useRef({ value: 0 });
  const portfolioProgressRef = useRef({ value: 0 });

  useFrame((state, delta) => {
    const p = masterProgressRef.current.value;

    // Update child scene progress values
    // Scan exclusively runs: 15% - 35%
    scanProgressRef.current.value = clamp01((p - 0.15) / 0.20);
    // Decision pause: 35% - 50%
    // Zoom/Portfolio runs: 50% - 65%
    portfolioProgressRef.current.value = clamp01((p - 0.50) / 0.15);

    // Cinematic Camera Motion Map:
    // Starts at Z=15. Slowly pushes in to tracking depths.
    let targetZ = 15;
    let targetY = 0;
    let targetX = 0;

    if (p < 0.25) {
      // Intro zoom
      targetZ = 15 - p * 8; // pushes in
      targetY = p * -2;     // drift slightly down
    } else if (p < 0.60) {
      // AI Scan to Match Found
      targetZ = 13 - (p - 0.25) * 5; 
      targetY = -0.5 + (p - 0.25) * -1;
    } else {
      // Portfolio, Skills, Projects pushes in to close depth
      targetZ = 11.25 - (p - 0.60) * 8; // pushes closer
      targetY = -0.85 + (p - 0.60) * -2;
    }

    // Heavy cinematic damping for weighted push-in feeling (lowered from 3 to 1.2)
    state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, targetZ, 1.2, delta);
    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, targetY, 1.2, delta);
    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, targetX, 1.2, delta);
  });

  return (
    <>
      <ResumeCloud
        scanProgressRef={scanProgressRef}
        portfolioProgressRef={portfolioProgressRef}
      />
      <SkillsScene masterProgressRef={masterProgressRef} />

      {/* Subtle depth of field for optical richness */}
      <EffectComposer>
        <DepthOfField
          focusDistance={0.025}
          focalLength={0.15}
          bokehScale={3.0}
        />
      </EffectComposer>
    </>
  );
}

/** Clamp a value between 0 and 1 */
function clamp01(v: number): number {
  return Math.min(Math.max(v, 0), 1);
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
