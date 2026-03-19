"use client";

/**
 * SkillsScene — 3D network of skill nodes with connecting lines.
 *
 * Performance Optimized:
 * - Uses InstancedMesh for the 5 solid nodes -> 1 draw call
 * - Uses InstancedMesh for the 5 glow halos -> 1 draw call
 * - Maps 7 connecting lines into a single LineSegments geometry -> 1 draw call
 * - HTML labels use lightweight Groups for tracking rather than full Meshes.
 */

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

const SKILLS = [
  { name: "Python", position: [-3.5, 2, 0] as [number, number, number] },
  { name: "DSA", position: [3.5, 2.5, -1] as [number, number, number] },
  { name: "Backend", position: [0, -2.5, 1] as [number, number, number] },
  { name: "APIs", position: [-3, -1, -2] as [number, number, number] },
  { name: "Git", position: [3, -1.5, -1] as [number, number, number] },
];

const CONNECTIONS: [number, number][] = [
  [0, 1], [0, 2], [0, 3],
  [1, 2], [2, 3], [2, 4], [3, 4],
];

interface SkillsSceneProps {
  masterProgressRef: React.MutableRefObject<{ value: number }>;
}

// Calculate the unified fade and scale state for the skills scene based on the master scroll progress (0 to 1).
function getSkillsPhase(p: number) {
  // 0–65% -> no skills
  // 65-80% -> show skills (fade in: 0.65-0.68, solid: 0.68-0.77, fade out: 0.77-0.80)
  // 80-100% -> hide skills
  let fade = 0;
  if (p < 0.65) fade = 0;
  else if (p < 0.68) fade = (p - 0.65) / 0.03;
  else if (p < 0.77) fade = 1;
  else if (p < 0.80) fade = 1 - (p - 0.77) / 0.03;
  else fade = 0;
  
  // Smooth easing
  return Math.min(Math.max(fade * fade * (3 - 2 * fade), 0), 1);
}

// Minimal component to track Html positions in useFrame without needing standard Meshes!
function HtmlTracker({ name, basePosition, timeOffset, masterProgressRef }: { name: string, basePosition: [number, number, number], timeOffset: number, masterProgressRef: React.MutableRefObject<{ value: number }> }) {
  const groupRef = useRef<THREE.Group>(null);
  const divRef = useRef<HTMLDivElement>(null);
  
  useFrame((state) => {
    if (!groupRef.current) return;
    const p = masterProgressRef.current.value;
    const fade = getSkillsPhase(p);
    
    if (fade <= 0.01) {
      if (divRef.current && divRef.current.style.visibility !== "hidden") {
        divRef.current.style.visibility = "hidden";
        divRef.current.style.opacity = "0";
      }
      return;
    }
    
    if (divRef.current) {
      divRef.current.style.visibility = "visible";
      divRef.current.style.opacity = fade.toString();
      divRef.current.style.transform = `scale(${0.8 + fade * 0.2})`;
    }

    const t = state.clock.elapsedTime + timeOffset;
    groupRef.current.position.x = basePosition[0] + Math.cos(t * 0.15) * 0.04;
    groupRef.current.position.y = basePosition[1] + Math.sin(t * 0.2) * 0.06;
    groupRef.current.position.z = basePosition[2];
  });

  return (
    <group ref={groupRef} position={basePosition}>
      <Html center distanceFactor={8} style={{ pointerEvents: "none", userSelect: "none" }}>
        <div ref={divRef} style={{ opacity: 0, visibility: "hidden", transition: "none", transform: "scale(0.8)", willChange: "opacity, transform" }}>
          <span className="text-white text-sm md:text-base font-mono font-bold whitespace-nowrap px-3 py-1.5 rounded-full bg-black/60 border border-white/20 backdrop-blur-sm shadow-[0_0_15px_rgba(102,245,255,0.22)]">
            {name}
          </span>
        </div>
      </Html>
    </group>
  );
}

export default function SkillsScene({ masterProgressRef }: SkillsSceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const solidMeshRef = useRef<THREE.InstancedMesh>(null);
  const glowMeshRef = useRef<THREE.InstancedMesh>(null);
  const linesRef = useRef<THREE.LineSegments>(null);

  const timeOffsets = useMemo(() => SKILLS.map((_, index) => index * 17.25), []);
  
  // Pre-allocate dummies to avoid new Objects in useFrame
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorTarget = useMemo(() => new THREE.Color(), []);

  // Pre-calculate line segments
  const linesGeom = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    CONNECTIONS.forEach(([a, b]) => {
      pts.push(new THREE.Vector3(...SKILLS[a].position));
      pts.push(new THREE.Vector3(...SKILLS[b].position));
    });
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    
    const p = masterProgressRef.current.value;
    const fade = getSkillsPhase(p);
    
    const isVisible = fade > 0.01;
    groupRef.current.visible = isVisible;
    if (!isVisible) return; // Save math if hidden

    const t = state.clock.elapsedTime;
    
    // Process instances
    if (solidMeshRef.current && glowMeshRef.current) {
      // Set global opacity for the solid mesh material
      (solidMeshRef.current.material as THREE.MeshStandardMaterial).opacity = fade;

      for (let i = 0; i < SKILLS.length; i++) {
        const skill = SKILLS[i];
        const offset = timeOffsets[i];
        const localT = t + offset;
        
        // Minimalist base positions with extremely subtle drift
        const x = skill.position[0] + Math.cos(localT * 0.15) * 0.04;
        const y = skill.position[1] + Math.sin(localT * 0.2) * 0.06;
        const z = skill.position[2];
        
        // Sequential node pulsing
        const nodePhase = Math.max(0, fade * 1.5 - i * 0.1); 
        const isActive = nodePhase > 0.5 && nodePhase < 1.2;
        
        const pulseScale = isActive ? 1 + Math.sin(localT * 3) * 0.1 : 1;
        
        // Smooth scale up when entering
        const instanceScale = (0.5 + fade * 0.5) * pulseScale;
        
        dummy.position.set(x, y, z);
        
        // Solid mesh transform
        dummy.scale.setScalar(instanceScale);
        dummy.updateMatrix();
        solidMeshRef.current.setMatrixAt(i, dummy.matrix);
        
        // Glow mesh transform & "opacity" via additive color hack (multiplied by master fade)
        dummy.scale.setScalar((isActive ? pulseScale * 2.5 : 1.5) * fade);
        dummy.updateMatrix();
        glowMeshRef.current.setMatrixAt(i, dummy.matrix);
        
        const glowIntensity = (isActive ? 0.3 + Math.sin(localT * 3) * 0.1 : 0.05) * fade;
        colorTarget.setRGB(0.4 * glowIntensity, 0.95 * glowIntensity, glowIntensity);
        glowMeshRef.current.setColorAt(i, colorTarget);
      }
      
      solidMeshRef.current.instanceMatrix.needsUpdate = true;
      glowMeshRef.current.instanceMatrix.needsUpdate = true;
      if (glowMeshRef.current.instanceColor) glowMeshRef.current.instanceColor.needsUpdate = true;
    }

    // Process uniforms
    if (linesRef.current) {
      const mat = linesRef.current.material as THREE.LineBasicMaterial;
      mat.opacity = fade * (0.15 + Math.sin(t * 0.5) * 0.05); // Pulsing uniform opacity multiplied by master fade
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 5, 5]} intensity={1} color="#66f5ff" />

      <instancedMesh ref={glowMeshRef} args={[undefined as never, undefined as never, SKILLS.length]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </instancedMesh>

      <instancedMesh ref={solidMeshRef} args={[undefined as never, undefined as never, SKILLS.length]}>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#66f5ff"
          emissiveIntensity={0.4}
          roughness={0.2}
          metalness={0.8}
          transparent
        />
      </instancedMesh>

      {/* HTML OVERLAYS */}
      {SKILLS.map((skill, i) => (
        <HtmlTracker 
          key={skill.name} 
          name={skill.name} 
          basePosition={skill.position} 
          timeOffset={timeOffsets[i]} 
          masterProgressRef={masterProgressRef} 
        />
      ))}

      <lineSegments ref={linesRef} geometry={linesGeom}>
        <lineBasicMaterial
          color="#66f5ff"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
}
