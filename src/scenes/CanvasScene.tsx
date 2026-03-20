"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import * as THREE from "three";
import { EffectComposer, DepthOfField } from "@react-three/postprocessing";
import ResumeCloud from "./ResumeCloud";
import SkillsScene from "./SkillsScene";

interface CanvasSceneProps {
  masterProgressRef?: React.MutableRefObject<{ value: number }>;
}

function clamp01(v: number): number {
  return Math.min(Math.max(v, 0), 1);
}

function smoothStep(v: number): number {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
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

    scanProgressRef.current.value = clamp01((p - 0.15) / 0.2);
    portfolioProgressRef.current.value = clamp01((p - 0.5) / 0.15);

    let targetZ = 15;
    let targetY = 0;
    let targetX = 0;

    if (p < 0.25) {
      targetZ = 15 - p * 8;
      targetY = p * -2;
    } else if (p < 0.47) {
      const scanBlend = smoothStep((p - 0.25) / 0.22);
      targetZ = THREE.MathUtils.lerp(13, 10.7, scanBlend);
      targetY = THREE.MathUtils.lerp(-0.55, -1.05, scanBlend);
      targetX = THREE.MathUtils.lerp(0, 0.08, scanBlend);
    } else if (p <= 0.50) {
      // 0.47-0.50: Match Found text holds completely still while target glows.
      targetZ = 10.7;
      targetY = -1.05;
      targetX = 0.08;
    } else if (p <= 0.58) {
      // 0.50-0.58: Physical Zoom matching the DOM exactly. Capped to prevent clipping.
      const zoomBlend = smoothStep((p - 0.50) / 0.08); // smoothStep natively provides slow-start/slow-stop easing!
      targetZ = THREE.MathUtils.lerp(10.7, 7.5, zoomBlend); // Z=7.5 gives approx 50% screen size
      targetY = THREE.MathUtils.lerp(-1.05, -0.6, zoomBlend); // Perfect centering
      targetX = THREE.MathUtils.lerp(0.08, 0.2, zoomBlend);
    } else {
      // > 0.58: Hard stop on the zoom. Readout phase while PortfolioReveal fades in. 
      // Extremely subtle slow drift backwards for premium depth feel.
      const drift = smoothStep((p - 0.58) / 0.42);
      targetZ = THREE.MathUtils.lerp(7.5, 7.8, drift);
      targetY = THREE.MathUtils.lerp(-0.6, -0.65, drift);
      targetX = THREE.MathUtils.lerp(0.2, 0.3, drift);
    }

    state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, targetZ, 2.3, delta);
    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, targetY, 2.05, delta);
    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, targetX, 2.05, delta);
    state.camera.lookAt(0, -0.05, 0.1);
  });

  return (
    <>
      <ResumeCloud
        scanProgressRef={scanProgressRef}
        portfolioProgressRef={portfolioProgressRef}
      />
      <SkillsScene masterProgressRef={masterProgressRef} />

      <EffectComposer>
        <DepthOfField
          focusDistance={0.021}
          focalLength={0.16}
          bokehScale={3.4}
        />
      </EffectComposer>
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
