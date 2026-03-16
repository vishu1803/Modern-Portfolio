"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const CARD_COUNT = 120;
const TARGET_INDEX = 42; // Arbitrary chosen resume card

interface ResumeCloudProps {
  scanProgressRef?: React.MutableRefObject<{ value: number }>;
  portfolioProgressRef?: React.MutableRefObject<{ value: number }>;
}

export default function ResumeCloud({ scanProgressRef, portfolioProgressRef }: ResumeCloudProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const beamRef = useRef<THREE.Mesh>(null);

  // Colors for scanning logic
  const baseColor = useMemo(() => new THREE.Color("#ffffff"), []);
  const dimColor = useMemo(() => new THREE.Color("#111122"), []);
  const highlightColor = useMemo(() => new THREE.Color("#00ffcc"), []);
  // Background/Calmer color when reading portfolio
  const calmColor = useMemo(() => new THREE.Color("#080810"), []);
  
  const currentColor = useMemo(() => new THREE.Color(), []);
  const targetColor = useMemo(() => new THREE.Color(), []);

  // Generate random data for cards 
  const cardsData = useMemo(() => {
    const data = [];
    for (let i = 0; i < CARD_COUNT; i++) {
      const isTarget = i === TARGET_INDEX;
      // Target remains closer to center
      const position = new THREE.Vector3(
        isTarget ? 0 : (Math.random() - 0.5) * 50,
        isTarget ? 0 : (Math.random() - 0.5) * 40,
        isTarget ? -10 : (Math.random() - 0.5) * 40 - 10
      );

      const rotation = new THREE.Euler(
        isTarget ? 0 : Math.random() * Math.PI,
        isTarget ? 0 : Math.random() * Math.PI,
        isTarget ? 0 : (Math.random() - 0.5) * 0.5
      );

      const scaleBase = 0.8 + Math.random() * 0.4;
      const scale = new THREE.Vector3(scaleBase, scaleBase, scaleBase);
      
      const speed = isTarget ? 0.05 : 0.2 + Math.random() * 0.8;
      const rotationSpeed = isTarget ? 0.05 : 0.1 + Math.random() * 0.5;
      const timeOffset = Math.random() * 100;

      data.push({ position, rotation, scale, speed, rotationSpeed, timeOffset, isTarget });
    }
    return data;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Initialize all instance colors to base neutral white
  useEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < CARD_COUNT; i++) {
      meshRef.current.setColorAt(i, baseColor);
    }
    meshRef.current.instanceColor!.needsUpdate = true;
  }, [baseColor]);

  useFrame((state) => {
    if (!meshRef.current) return;
    
    const time = state.clock.elapsedTime;
    const progress = scanProgressRef?.current?.value || 0;
    const portfolioProgress = portfolioProgressRef?.current?.value || 0;
    
    // Beam travels from Z=20 (front) to Z=-40 (back) relative to group
    const beamZ = 20 - (progress * 60); 
    
    if (beamRef.current) {
      beamRef.current.position.z = Math.max(beamZ, -50); // don't let it go infinitely back
      // Beam disappears as portfolio comes firmly into view
      beamRef.current.visible = progress > 0 && progress < 1 && portfolioProgress < 0.2;
      // Pulse animation for the beam thickness
      beamRef.current.scale.y = 1 + Math.sin(time * 15) * 0.3;
    }

    // 1. Animate all individual instanced cards
    cardsData.forEach((data, i) => {
      // Slow down time effectively by factoring in portfolio progress (1 = read mode, 0 = scan mode)
      // They drift 80% slower when we are reading the portfolio
      const speedMultiplier = 1 - (portfolioProgress * 0.8);
      
      // Calculate a stable time property that doesn't jump, 
      // but grows slower as speedMultiplier decreases
      // Since this is hard to do without integrating frame delta, 
      // we'll just scale the magnitude of the sine waves slightly to calm them
      const t = time + data.timeOffset;
      const moveMagnitude = 0.3 * speedMultiplier;
      const moveFreq = data.speed * (0.5 + 0.5 * speedMultiplier);
      const rotMagnitude = 0.1 * speedMultiplier;
      
      // Target card flattens out and moves to front
      if (data.isTarget && progress > 0.8) {
          dummy.rotation.set(0, 0, 0);
          
          // As portfolio comes in, target resume moves down and scales up to frame it maybe? 
          // Or just stays in background quietly. We'll have it drift very slightly left.
          const targetFinalX = portfolioProgress * -2;
          const targetFinalY = portfolioProgress * 1;
          const targetFinalZ = 5 + (portfolioProgress * 2); // Push slightly back so it doesn't clip HTML

          data.position.lerp(new THREE.Vector3(targetFinalX, targetFinalY, targetFinalZ), 0.05);
          dummy.position.copy(data.position);
      } else {
          // Normal constrained drift
           dummy.position.set(
            data.position.x + Math.cos(t * moveFreq * 0.8) * moveMagnitude,
            data.position.y + Math.sin(t * moveFreq) * (moveMagnitude * 1.5),
            data.position.z 
          );
          dummy.rotation.set(
            data.rotation.x + Math.sin(t * data.rotationSpeed) * rotMagnitude,
            data.rotation.y + Math.cos(t * data.rotationSpeed * 1.2) * rotMagnitude,
            data.rotation.z + Math.sin(t * data.rotationSpeed * 0.5) * (rotMagnitude * 0.5)
          );
      }
      
      dummy.scale.copy(data.scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);

      // Color scanning logic based on beam position
      const hasPassed = data.position.z > beamZ;
      const distanceToBeam = Math.abs(data.position.z - beamZ);

      meshRef.current!.getColorAt(i, currentColor);

      if (data.isTarget) {
         if (portfolioProgress > 0) {
             // Calm the selected resume color down so it isn't pure neon behind the text
             targetColor.copy(highlightColor).lerp(dimColor, portfolioProgress * 0.6);
         } else {
            targetColor.copy(hasPassed ? highlightColor : baseColor);
         }
         currentColor.lerp(targetColor, 0.1);
      } else {
         if (distanceToBeam < 3 && progress > 0 && progress < 1) {
             targetColor.set("#ffffff"); 
             currentColor.lerp(targetColor, 0.5); 
         } else {
             // As portfolio comes in, ALL other resumes fade deeply into darkness
             const baseFadeColor = hasPassed ? dimColor : baseColor;
             targetColor.copy(baseFadeColor).lerp(calmColor, portfolioProgress);
             currentColor.lerp(targetColor, 0.05); 
         }
      }
      
      meshRef.current!.setColorAt(i, currentColor);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;

    // 2. Animate the overall group
    if (groupRef.current) {
        // Slow down global group bobbing based on portfolio progress
        const groupBob = Math.cos(time * 0.05) * 2;
        groupRef.current.position.y = THREE.MathUtils.lerp(groupBob, 0, portfolioProgress);
        
        // Drive camera depth via scan progress (pinned, no window.scrollY)
        // During scan phase, push the group forward so camera "flies through" the cloud
        const scanDepth = progress * 30; // 0 to 30 units of depth during scan
        const calmPull = portfolioProgress * 10; // Pull back further as portfolio reveals
        groupRef.current.position.z = Math.sin(time * 0.05) * 3 + scanDepth + calmPull;
    }
  });

  return (
    <>
      <color attach="background" args={["#05050a"]} />
      <fog attach="fog" args={["#05050a", 10, 60]} />

      <ambientLight intensity={0.2} color="#ffffff" />
      <directionalLight position={[10, 10, 10]} intensity={0.5} color="#a0c0ff" />
      <spotLight position={[-15, -15, -20]} intensity={3} angle={0.6} penumbra={1} color="#0066ff" distance={100} />
      <spotLight position={[15, 20, -10]} intensity={2} angle={0.5} penumbra={1} color="#00ffff" distance={80} />

      <group ref={groupRef}>
        
        {/* The Scanning Beam representation */}
        <mesh ref={beamRef} visible={false}>
          {/* Very wide and thin plane representing the scan line */}
          <planeGeometry args={[150, 1.5]} />
          <meshBasicMaterial 
            color="#00ffff" 
            transparent 
            opacity={0.4} 
            blending={THREE.AdditiveBlending} 
            depthWrite={false} 
            side={THREE.DoubleSide}
          />
        </mesh>

        <instancedMesh ref={meshRef} args={[null as any, null as any, CARD_COUNT]} castShadow receiveShadow>
            <boxGeometry args={[1.5, 2.1, 0.02]} />
            <meshStandardMaterial 
                color="#ffffff" 
                roughness={0.2} 
                metalness={0.8}
                envMapIntensity={1}
            />
        </instancedMesh>
      </group>
    </>
  );
}
