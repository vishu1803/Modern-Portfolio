"use client";

/**
 * ResumeCloud — InstancedMesh rendering 120 floating resume cards
 * with an AI scanning beam effect.
 *
 * Performance notes:
 * - Single InstancedMesh for all cards (1 draw call)
 * - No allocations inside useFrame (reuses _lerpTarget vector)
 * - Colors lerped per-instance for smooth transitions
 */

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";

const CARD_COUNT = 120;
const TARGET_INDEX = 42;

interface ResumeCloudProps {
  scanProgressRef?: React.MutableRefObject<{ value: number }>;
  portfolioProgressRef?: React.MutableRefObject<{ value: number }>;
}

export default function ResumeCloud({ scanProgressRef, portfolioProgressRef }: ResumeCloudProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const beamRef = useRef<THREE.Mesh>(null);
  const beamLightRef = useRef<THREE.PointLight>(null);

  // Procedural canvas texture mapping for all resumes
  const resumeTexture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 358;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Background - slightly off-white/gray
    ctx.fillStyle = "#e8e8ed";
    ctx.fillRect(0, 0, 256, 358);

    // Border & subtle shadow via stroke
    ctx.strokeStyle = "#d0d0d5";
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 252, 354);

    // Header
    ctx.fillStyle = "#333344";
    ctx.fillRect(20, 20, 100, 14); // Name
    ctx.fillStyle = "#888899";
    ctx.fillRect(20, 45, 140, 6);  // Title
    ctx.fillRect(20, 56, 80, 4);   // Subtitle

    // Divider
    ctx.fillStyle = "#cccccc";
    ctx.fillRect(20, 75, 216, 2);

    // Sections
    for (let i = 0; i < 3; i++) {
      const y = 95 + i * 85;
      ctx.fillStyle = "#666677";
      ctx.fillRect(20, y, 60, 8); // Section Header
      
      ctx.fillStyle = "#bbbbcc";
      ctx.fillRect(20, y + 20, 216, 5);
      ctx.fillRect(20, y + 32, 216, 5);
      ctx.fillRect(20, y + 44, 150 + Math.random() * 50, 5);
      
      if (i < 2) {
        ctx.fillStyle = "#a8a8bb";
        ctx.fillRect(20, y + 58, 40, 4);
        ctx.fillRect(65, y + 58, 40, 4);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace; // Correct sRGB handling for React Three Fiber (R152+)
    texture.anisotropy = 16;
    return texture;
  }, []);

  // Pre-allocated colors
  const baseColors = useMemo(() => {
    const colors = [];
    for (let i = 0; i < CARD_COUNT; i++) {
      // Slight pastel tones: off-white, light gray, pale blue
      const r = 0.85 + Math.random() * 0.15;
      const g = 0.85 + Math.random() * 0.15;
      const b = 0.90 + Math.random() * 0.10;
      colors.push(new THREE.Color(r, g, b));
    }
    return colors;
  }, []);
  const dimColor = useMemo(() => new THREE.Color("#020610"), []); // Much darker to simulate faded resumes
  const scanGlowColor = useMemo(() => new THREE.Color("#00ffff"), []); // Intense cyan for beam interaction
  const highlightColor = useMemo(() => new THREE.Color("#00ffcc"), []);
  const calmColor = useMemo(() => new THREE.Color("#080810"), []);
  const currentColor = useMemo(() => new THREE.Color(), []);
  const targetColor = useMemo(() => new THREE.Color(), []);

  // Pre-allocated vector for lerp target (avoids new THREE.Vector3 every frame)
  const _lerpTarget = useMemo(() => new THREE.Vector3(), []);

  // Generate strict, deterministic organized database structure
  const cardsData = useMemo(() => {
    const data = [];
    for (let i = 0; i < CARD_COUNT; i++) {
      const isTarget = i === TARGET_INDEX;
      
      // Z goes strictly back from +10 to -40 based on index to ensure chronological scanning
      const zPos = 10 - (i / CARD_COUNT) * 50; 
      
      // X and Y form a strict cylindrical grid/tunnel
      const angle = i * ((Math.PI * 2) / 12); // 12 columns
      const radius = 8 + (i % 3) * 2; // Fixed tiers of radius (8, 10, 12)
      
      const position = new THREE.Vector3(
        isTarget ? 0 : Math.cos(angle) * radius,
        isTarget ? 0 : Math.sin(angle) * (radius * 0.7), // Flatten Y slightly
        isTarget ? -7.5 : zPos // Target placed exactly at its timeline sequence depth
      );
      
      const rotation = new THREE.Euler(0, 0, 0); // No random rotation! AI database is perfectly aligned.
      
      const scaleBase = isTarget ? 1.2 : 0.85;
      const scale = new THREE.Vector3(scaleBase, scaleBase, scaleBase);
      
      const speed = 0; // Absolute frozen precision
      const rotationSpeed = 0;
      const timeOffset = 0;
      data.push({ position, rotation, scale, speed, rotationSpeed, timeOffset, isTarget });
    }
    return data;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Initialize instance colors
  useEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < CARD_COUNT; i++) {
      meshRef.current.setColorAt(i, baseColors[i]);
    }
    meshRef.current.instanceColor!.needsUpdate = true;
  }, [baseColors]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const time = state.clock.elapsedTime;
    const progress = scanProgressRef?.current?.value ?? 0;
    const portfolioProgress = portfolioProgressRef?.current?.value ?? 0;

    // Beam position (Z=20 front → Z=-50 back) with easeInOutCubic curve for intelligent scanning
    const easeProgress = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    const beamZ = 20 - easeProgress * 70;

    // Update beam and flicker
    if (beamRef.current) {
      beamRef.current.position.z = Math.max(beamZ, -50);
      const isVisible = progress > 0 && progress < 0.98 && portfolioProgress === 0;
      beamRef.current.visible = isVisible;
      
      // Cinematic flicker
      const flicker = 0.6 + Math.random() * 0.4;
      beamRef.current.scale.y = 1 + Math.sin(time * 20) * 0.5 * flicker;
      const mat = beamRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.5 * flicker;

      if (beamLightRef.current) {
        beamLightRef.current.intensity = isVisible ? 20 * flicker : 0;
      }
    }

    // Calming multiplier: resumes drift slower during portfolio/skills/projects
    const speedMultiplier = 1 - portfolioProgress * 0.8;

    // Update each instance
    for (let i = 0; i < CARD_COUNT; i++) {
      const data = cardsData[i];
      const t = time + data.timeOffset;
      
      // Minimalist drifting (cut significantly for cinematic stillness)
      const moveMag = 0.08 * speedMultiplier;
      const moveFreq = data.speed * (0.3 + 0.3 * speedMultiplier);
      const rotMag = 0.03 * speedMultiplier;

      // Organic, minimalistic continuous floating and tumbling for all cards
      const zBob = Math.sin(t * moveFreq * 0.5) * moveMag * 1.5;
      dummy.position.set(
        data.position.x + Math.sin(t * moveFreq) * moveMag * 2,
        data.position.y + Math.cos(t * moveFreq * 0.8) * moveMag * 2,
        data.position.z + zBob
      );
      dummy.rotation.set(
        data.rotation.x + t * rotMag * 0.5,
        data.rotation.y + t * rotMag * 0.3,
        data.rotation.z + Math.sin(t * rotMag) * 0.05
      );

      dummy.scale.copy(data.scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);

      // Color logic using exact spatial differentials for intelligent scanning delays
      const currentBeamZ = beamRef.current ? beamRef.current.position.z : beamZ;
      const diff = dummy.position.z - currentBeamZ; // Positive if beam has moved PAST the card
      meshRef.current!.getColorAt(i, currentColor);

      if (data.isTarget) {
        if (portfolioProgress > 0) {
          targetColor.copy(highlightColor).lerp(dimColor, portfolioProgress * 0.6);
        } else if (progress === 1 && portfolioProgress === 0) {
          // Decision Moment Focus! Pulse teal.
          const pulse = 0.8 + 0.2 * Math.sin(time * 8);
          targetColor.copy(highlightColor).multiplyScalar(pulse);
        } else if (Math.abs(diff) < 4 && progress > 0 && progress < 1) {
          targetColor.copy(scanGlowColor); // Intense scan interaction
        } else {
          targetColor.copy(diff > 0 ? highlightColor : baseColors[i]);
        }
        currentColor.lerp(targetColor, 15 * delta);
        
        // Ensure Target pops into foreground smoothly right as decision completes
        if (progress > 0.9) {
          dummy.rotation.set(
            THREE.MathUtils.damp(dummy.rotation.x, 0, 5, delta),
            THREE.MathUtils.damp(dummy.rotation.y, 0, 5, delta),
            THREE.MathUtils.damp(dummy.rotation.z, 0, 5, delta)
          );
          _lerpTarget.set(
            portfolioProgress * -2,
            portfolioProgress * 1,
            5 + portfolioProgress * 2
          );
          data.position.lerp(_lerpTarget, 4 * delta);
          dummy.position.copy(data.position);
        }
      } else {
        if (Math.abs(diff) < 4 && progress > 0 && progress < 1) {
          // Beam passing: glow flash
          targetColor.copy(scanGlowColor);
          currentColor.lerp(targetColor, 25 * delta);
        } else if (diff > 4 && diff < 15 && progress < 1) {
          // Short delay before rejection: return to normal base color
          targetColor.copy(baseColors[i]);
          currentColor.lerp(targetColor, 8 * delta); // Smooth recovery
        } else if (diff >= 15 || progress === 1) {
          // Rejected! (or decision moment hit)
          targetColor.copy(dimColor);
          currentColor.lerp(targetColor, 3 * delta); // Slow, dramatic fade out
        } else {
          // Not yet scanned
          targetColor.copy(baseColors[i]);
          currentColor.lerp(targetColor, 5 * delta);
        }

        // Push everything far black smoothly during portfolio expansion
        if (portfolioProgress > 0) {
           targetColor.copy(dimColor).lerp(new THREE.Color("#000000"), portfolioProgress);
           currentColor.lerp(targetColor, 5 * delta);
        }
      }

      meshRef.current!.setColorAt(i, currentColor);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;

    // Group movement
    if (groupRef.current) {
      const groupBob = Math.cos(time * 0.05) * 2;
      groupRef.current.position.y = THREE.MathUtils.lerp(groupBob, 0, portfolioProgress);
      const scanDepth = progress * 30;
      const calmPull = portfolioProgress * 10;
      groupRef.current.position.z = Math.sin(time * 0.05) * 3 + scanDepth + calmPull;
    }
  });

  return (
    <>
      <color attach="background" args={["#030308"]} />
      <fog attach="fog" args={["#030308", 10, 65]} />

      <ambientLight intensity={0.3} color="#ffffff" />
      <directionalLight position={[10, 20, 15]} intensity={1.2} color="#cce0ff" />
      <spotLight position={[-20, -10, -20]} intensity={5} angle={0.8} penumbra={1} color="#0044ff" distance={120} />
      <spotLight position={[20, 30, -10]} intensity={3} angle={0.6} penumbra={1} color="#00ffcc" distance={100} />
      <pointLight position={[0, 0, 5]} intensity={0.8} color="#ffffff" distance={40} />
      
      <Environment preset="city" />

      <group ref={groupRef}>
        {/* Scanning Beam */}
        <mesh ref={beamRef} visible={false}>
          <planeGeometry args={[28, 0.3]} />
          <meshBasicMaterial
            color="#00ffff"
            transparent
            opacity={0.8}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
          <pointLight ref={beamLightRef} color="#00ffff" distance={25} decay={1.5} intensity={0} />
        </mesh>

        {/* Instanced Resume Cards */}
        <instancedMesh ref={meshRef} args={[undefined as any, undefined as any, CARD_COUNT]}>
          <boxGeometry args={[1.6, 2.2, 0.04]} />
          <meshStandardMaterial
            color="#ffffff"
            map={resumeTexture || undefined}
            roughness={0.4}
            metalness={0.2}
            emissive="#222233"
            emissiveIntensity={0.15}
            envMapIntensity={1.0}
          />
        </instancedMesh>
      </group>
    </>
  );
}
