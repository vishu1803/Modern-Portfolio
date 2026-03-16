"use client";

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

// Define which nodes connect to which
const CONNECTIONS: [number, number][] = [
  [0, 1], // Python - DSA
  [0, 2], // Python - Backend
  [0, 3], // Python - APIs
  [1, 2], // DSA - Backend
  [2, 3], // Backend - APIs
  [2, 4], // Backend - Git
  [3, 4], // APIs - Git
];

interface SkillsSceneProps {
  progressRef: React.MutableRefObject<{ value: number }>;
}

// Individual Skill Node
function SkillNode({
  name,
  position,
  index,
  progressRef,
}: {
  name: string;
  position: [number, number, number];
  index: number;
  progressRef: React.MutableRefObject<{ value: number }>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const timeOffset = useRef(Math.random() * 100);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime + timeOffset.current;
    const progress = progressRef.current.value;

    // Gentle floating
    meshRef.current.position.y = position[1] + Math.sin(t * 0.5) * 0.15;
    meshRef.current.position.x = position[0] + Math.cos(t * 0.3) * 0.1;

    // Each node activates sequentially based on scroll progress
    // Node 0 activates at progress 0.0-0.2, node 1 at 0.2-0.4, etc.
    const activationStart = index / SKILLS.length;
    const activationEnd = (index + 1) / SKILLS.length;
    const isActive = progress >= activationStart && progress <= activationEnd + 0.3;

    // Pulse scale when active
    const baseScale = 1;
    const pulseScale = isActive ? baseScale + Math.sin(t * 3) * 0.1 : baseScale;
    meshRef.current.scale.setScalar(pulseScale);

    // Glow effect
    if (glowRef.current) {
      glowRef.current.position.copy(meshRef.current.position);
      glowRef.current.scale.setScalar(isActive ? pulseScale * 2.5 : 1.5);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = isActive ? 0.3 + Math.sin(t * 3) * 0.1 : 0.05;
    }
  });

  return (
    <group>
      {/* Glow sphere behind the node */}
      <mesh ref={glowRef} position={position}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshBasicMaterial
          color="#00ccff"
          transparent
          opacity={0.05}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Main node sphere */}
      <mesh ref={meshRef} position={position}>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#00aaff"
          emissiveIntensity={0.4}
          roughness={0.2}
          metalness={0.8}
        />

        {/* HTML label for accessibility */}
        <Html
          center
          distanceFactor={8}
          style={{
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          <span className="text-white text-sm md:text-base font-mono font-bold whitespace-nowrap px-3 py-1.5 rounded-full bg-black/60 border border-white/20 backdrop-blur-sm">
            {name}
          </span>
        </Html>
      </mesh>
    </group>
  );
}

// Connection Lines between nodes
function ConnectionLines({ progressRef }: { progressRef: React.MutableRefObject<{ value: number }> }) {
  const linesRef = useRef<THREE.Group>(null);

  const lineObjects = useMemo(() => {
    return CONNECTIONS.map(([a, b]) => {
      const points = [
        new THREE.Vector3(...SKILLS[a].position),
        new THREE.Vector3(...SKILLS[b].position),
      ];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: "#00aaff",
        transparent: true,
        opacity: 0.1,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      return new THREE.Line(geometry, material);
    });
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const progress = progressRef.current.value;

    lineObjects.forEach((lineObj, i) => {
      const mat = lineObj.material as THREE.LineBasicMaterial;
      const lineProgress = Math.min(progress * 2, 1);
      mat.opacity = lineProgress * (0.15 + Math.sin(t * 0.5 + i) * 0.05);
    });
  });

  return (
    <group ref={linesRef}>
      {lineObjects.map((lineObj, i) => (
        <primitive key={i} object={lineObj} />
      ))}
    </group>
  );
}

// Main SkillsScene
export default function SkillsScene({ progressRef }: SkillsSceneProps) {
  return (
    <group>
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 5, 5]} intensity={1} color="#00aaff" />

      {SKILLS.map((skill, i) => (
        <SkillNode
          key={skill.name}
          name={skill.name}
          position={skill.position}
          index={i}
          progressRef={progressRef}
        />
      ))}

      <ConnectionLines progressRef={progressRef} />
    </group>
  );
}
