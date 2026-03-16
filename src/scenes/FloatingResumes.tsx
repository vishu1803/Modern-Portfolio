"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 1200;

export default function FloatingResumes() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  // Data for all floating resumes
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < COUNT; i++) {
        // Distribute them in a cylindrical or spherical volume initially
        const radius = Math.random() * 25 + 5;
        const theta = Math.random() * 2 * Math.PI;
        const y = (Math.random() - 0.5) * 40;
        
        const x = radius * Math.cos(theta);
        const z = radius * Math.sin(theta) - 10;
        
        const speed = Math.random() * 0.02 + 0.005;
        const rotationSpeed = (Math.random() - 0.5) * 0.01;
        temp.push({ x, y, z, speed, rotationSpeed });
    }
    return temp;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // A single special resume representing the 'selected' one
  const selectedResumeRef = useRef<THREE.Mesh>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useFrame((state) => {
    const maxScroll = document.body.scrollHeight - window.innerHeight || 1;
    const scrollProgress = Math.min(Math.max(scrollY / maxScroll, 0), 1); // 0 to 1

    const time = state.clock.elapsedTime;
    
    // Animate the cloud
    particles.forEach((particle, i) => {
        // As scroll progress increases, make them fly away or fade
        const spread = 1 + scrollProgress * 15; 
        const wave = Math.sin(time * particle.speed + i);
        
        dummy.position.set(
            particle.x * spread + wave,
            particle.y + wave * 5, // add a little floaty motion up/down
            particle.z * spread
        );
        dummy.rotation.set(
            time * particle.rotationSpeed,
            Math.sin(time * 0.1) * 0.5 + i,
            Math.cos(time * 0.1) * 0.5
        );
        // Resumes are flat rectangle
        dummy.scale.set(1.5, 2.1, 0.02);
        dummy.updateMatrix();
        
        if (meshRef.current) {
            meshRef.current.setMatrixAt(i, dummy.matrix);
        }
    });

    if (meshRef.current) {
        meshRef.current.instanceMatrix.needsUpdate = true;
    }

    // Animate the selected resume coming to the center
    if (selectedResumeRef.current) {
      // Starts somewhere in the crowd
      const startX = 0;
      const startY = 10;
      const startZ = -20;
      
      // Ends right in front of the camera
      const endX = 0;
      const endY = 0;
      const endZ = 13; // Camera is at 15

      // Ease the progress - we want the resume to arrive quickly and stay at front
      // or progressively move over the first 30% of scroll
      const p = Math.min(scrollProgress * 3, 1);
      // Easing function for smooth arrival
      const ease = 1 - Math.pow(1 - p, 3);
      
      // Lerp position
      selectedResumeRef.current.position.set(
        THREE.MathUtils.lerp(startX, endX, ease),
        THREE.MathUtils.lerp(startY, endY, ease),
        THREE.MathUtils.lerp(startZ, endZ, ease)
      );

      // Lerp rotation to face camera perfectly when arrived
      selectedResumeRef.current.rotation.set(
        THREE.MathUtils.lerp(time * 0.5, 0, ease),
        THREE.MathUtils.lerp(time * 0.3, 0, ease),
        THREE.MathUtils.lerp(time * 0.1, 0, ease)
      );
      
      // Make it flip as it approaches
      if (p < 1) {
          selectedResumeRef.current.rotation.y += Math.sin(ease * Math.PI) * 4;
      }
    }
  });

  return (
    <group>
      <instancedMesh ref={meshRef} args={[null as any, null as any, COUNT]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#333333" roughness={0.7} opacity={0.5} transparent />
      </instancedMesh>
      
      {/* The selected resume */}
      <mesh ref={selectedResumeRef} receiveShadow castShadow>
        <boxGeometry args={[1.6, 2.2, 0.05]} />
        <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.2} emissive="#111" />
      </mesh>
    </group>
  );
}
