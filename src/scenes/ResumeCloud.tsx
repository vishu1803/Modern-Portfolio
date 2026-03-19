"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";

const CARD_COUNT = 72;
const TARGET_INDEX = 41;
const BEAM_START_Z = 10;
const BEAM_END_Z = -46;
const SCAN_DISTANCE_THRESHOLD = 2.35;
const SCAN_FEEDBACK_WINDOW = 0.018;
const SCAN_DECISION_DELAY = 0.028;
const SCAN_RESOLVE_WINDOW = 0.075;
const TARGET_HOLD_DELAY = 0.045;
const DECISION_MOMENT_START = 0.955;
const DECISION_MOMENT_WINDOW = 0.045;

interface ResumeCloudProps {
  scanProgressRef?: React.MutableRefObject<{ value: number }>;
  portfolioProgressRef?: React.MutableRefObject<{ value: number }>;
}

interface CardData {
  index: number;
  position: THREE.Vector3;
  scale: THREE.Vector3;
  triggerProgress: number;
  isTarget: boolean;
}

function clamp01(v: number) {
  return Math.min(Math.max(v, 0), 1);
}

function easeInOutCubic(v: number) {
  return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2;
}

function smoothStep(v: number) {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
}

export default function ResumeCloud({ scanProgressRef, portfolioProgressRef }: ResumeCloudProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const beamGroupRef = useRef<THREE.Group>(null);
  const beamCoreRef = useRef<THREE.Mesh>(null);
  const beamHaloRef = useRef<THREE.Mesh>(null);
  const beamSpillRef = useRef<THREE.Mesh>(null);
  const beamLightRef = useRef<THREE.PointLight>(null);
  const beamLightWideRef = useRef<THREE.PointLight>(null);
  const scanPulseRef = useRef<THREE.Mesh>(null);
  const decisionGroupRef = useRef<THREE.Group>(null);
  const decisionLightRef = useRef<THREE.PointLight>(null);

  const resumeTexture = useMemo(() => {
    if (typeof document === "undefined") return null;

    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 358;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = "#eef1f5";
    ctx.fillRect(0, 0, 256, 358);

    ctx.strokeStyle = "#d4d9e2";
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 252, 354);

    ctx.fillStyle = "#303848";
    ctx.fillRect(20, 20, 106, 14);
    ctx.fillStyle = "#8892a4";
    ctx.fillRect(20, 45, 142, 6);
    ctx.fillRect(20, 56, 84, 4);

    ctx.fillStyle = "#d1d6df";
    ctx.fillRect(20, 75, 216, 2);

    const sectionWidths = [170, 190, 178];
    for (let i = 0; i < 3; i++) {
      const y = 95 + i * 85;
      ctx.fillStyle = "#5d6678";
      ctx.fillRect(20, y, 62, 8);

      ctx.fillStyle = "#bac1ce";
      ctx.fillRect(20, y + 20, 216, 5);
      ctx.fillRect(20, y + 32, 216, 5);
      ctx.fillRect(20, y + 44, sectionWidths[i], 5);

      if (i < 2) {
        ctx.fillStyle = "#a9b2c3";
        ctx.fillRect(20, y + 58, 40, 4);
        ctx.fillRect(65, y + 58, 40, 4);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 16;
    return texture;
  }, []);

  const baseColors = useMemo(
    () =>
      Array.from({ length: CARD_COUNT }, (_, index) => {
        const shade = 0.9 + (index % 4) * 0.016;
        return new THREE.Color(shade, shade + 0.012, 0.97);
      }),
    []
  );
  const rejectedColor = useMemo(() => new THREE.Color("#04101f"), []);
  const scanGlowColor = useMemo(() => new THREE.Color("#4feaff"), []);
  const targetGlowColor = useMemo(() => new THREE.Color("#85ffd7"), []);
  const decisionColor = useMemo(() => new THREE.Color("#dffcff"), []);
  const hiddenColor = useMemo(() => new THREE.Color("#000000"), []);
  const currentColor = useMemo(() => new THREE.Color(), []);
  const nextColor = useMemo(() => new THREE.Color(), []);
  const beamPosition = useMemo(() => new THREE.Vector3(), []);
  const cardPosition = useMemo(() => new THREE.Vector3(), []);
  const activePulsePosition = useMemo(() => new THREE.Vector3(), []);
  const targetFocusPosition = useMemo(() => new THREE.Vector3(), []);
  const cameraTargetPosition = useMemo(() => new THREE.Vector3(0, 0, 1.8), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const cardsData = useMemo<CardData[]>(() => {
    const columns = 4;
    const rows = 3;
    const xSpacing = 2.15;
    const ySpacing = 1.65;
    const layerDepth = columns * rows;
    const data: CardData[] = [];

    for (let i = 0; i < CARD_COUNT; i++) {
      const column = i % columns;
      const row = Math.floor(i / columns) % rows;
      const layer = Math.floor(i / layerDepth);
      const x = (column - (columns - 1) / 2) * xSpacing;
      const y = ((rows - 1) / 2 - row) * ySpacing;
      const z = 8.5 - i * 0.74 - layer * 0.18;
      const isTarget = i === TARGET_INDEX;
      const triggerProgress = clamp01((BEAM_START_Z - z) / (BEAM_START_Z - BEAM_END_Z));
      const scaleValue = isTarget ? 1 : 0.92;

      data.push({
        index: i,
        position: new THREE.Vector3(isTarget ? 0.2 : x, isTarget ? 0.15 : y, isTarget ? z + 0.15 : z),
        scale: new THREE.Vector3(scaleValue, scaleValue, scaleValue),
        triggerProgress,
        isTarget,
      });
    }

    return data;
  }, []);

  useEffect(() => {
    if (!meshRef.current) return;

    for (let i = 0; i < CARD_COUNT; i++) {
      meshRef.current.setColorAt(i, baseColors[i]);
    }

    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [baseColors]);

  useFrame((state) => {
    if (!meshRef.current) return;

    const progress = scanProgressRef?.current?.value ?? 0;
    const portfolioProgress = portfolioProgressRef?.current?.value ?? 0;
    const beamTravel = easeInOutCubic(progress);
    const beamZ = THREE.MathUtils.lerp(BEAM_START_Z, BEAM_END_Z, beamTravel);
    const beamPulse = 0.9 + Math.sin(state.clock.elapsedTime * 9) * 0.06;
    const decisionMoment = smoothStep((progress - DECISION_MOMENT_START) / DECISION_MOMENT_WINDOW);
    const decisionFade = 1 - smoothStep((portfolioProgress - 0.14) / 0.16);
    const decisionStrength = decisionMoment * decisionFade;
    const zoomProgress = smoothStep((portfolioProgress - 0.34) / 0.66);

    beamPosition.set(0, 0, beamZ);

    let strongestPulse = 0;

    if (beamGroupRef.current && beamCoreRef.current && beamHaloRef.current && beamSpillRef.current) {
      const beamVisible = progress > 0.001 && progress < 0.995 && portfolioProgress < 0.24;
      beamGroupRef.current.visible = beamVisible;
      beamGroupRef.current.position.set(0, 0, beamZ);

      const coreMaterial = beamCoreRef.current.material as THREE.MeshBasicMaterial;
      const haloMaterial = beamHaloRef.current.material as THREE.MeshBasicMaterial;
      const spillMaterial = beamSpillRef.current.material as THREE.MeshBasicMaterial;
      const beamEnergy = (1 - decisionMoment * 0.7) * beamPulse;

      coreMaterial.opacity = 0.94 * beamEnergy;
      haloMaterial.opacity = 0.34 * beamEnergy;
      spillMaterial.opacity = 0.13 * beamEnergy;
      beamGroupRef.current.scale.set(1, 1 + (beamPulse - 0.9) * 0.16, 1);

      if (beamLightRef.current) {
        beamLightRef.current.intensity = beamVisible ? 10 * beamEnergy : 0;
      }

      if (beamLightWideRef.current) {
        beamLightWideRef.current.intensity = beamVisible ? 4.8 * beamEnergy : 0;
      }
    }

    for (let i = 0; i < CARD_COUNT; i++) {
      const data = cardsData[i];
      const sinceTrigger = progress - data.triggerProgress;
      const beamDistance = beamPosition.distanceTo(data.position);
      const isBeamContact = progress > 0 && beamDistance < SCAN_DISTANCE_THRESHOLD;
      const scanPulse = isBeamContact ? 1 - beamDistance / SCAN_DISTANCE_THRESHOLD : 0;
      const scanEcho = sinceTrigger >= 0 && sinceTrigger < SCAN_FEEDBACK_WINDOW
        ? 1 - clamp01(sinceTrigger / SCAN_FEEDBACK_WINDOW)
        : 0;
      const scanSignal = Math.max(scanPulse, scanEcho);
      const rejectProgress = data.isTarget ? 0 : smoothStep((sinceTrigger - SCAN_DECISION_DELAY) / SCAN_RESOLVE_WINDOW);
      const targetResolve = smoothStep((sinceTrigger - TARGET_HOLD_DELAY) / SCAN_RESOLVE_WINDOW);
      cardPosition.copy(data.position);
      if (data.isTarget) {
        cardPosition.lerp(cameraTargetPosition, zoomProgress);
        targetFocusPosition.copy(cardPosition);
      }

      let scaleFactor = 1;
      if (data.isTarget) {
        scaleFactor = 1 + targetResolve * 0.16 + decisionStrength * 0.12 + zoomProgress * 1.42;
      } else {
        scaleFactor = 1 - rejectProgress * 0.82;
        if (rejectProgress > 0.7) {
          scaleFactor -= (rejectProgress - 0.7) / 0.3 * 0.17;
        }
      }

      const offsetX = !data.isTarget && rejectProgress > 0
        ? (data.index % 2 === 0 ? -1 : 1) * rejectProgress * 0.18
        : 0;
      const offsetY = !data.isTarget && rejectProgress > 0 ? -rejectProgress * 0.12 : 0;

      dummy.position.set(cardPosition.x + offsetX, cardPosition.y + offsetY, cardPosition.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.copy(data.scale).multiplyScalar(Math.max(scaleFactor, 0.001));
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      meshRef.current.getColorAt(i, currentColor);
      nextColor.copy(baseColors[i]);

      if (data.isTarget) {
        if (sinceTrigger >= TARGET_HOLD_DELAY) {
          nextColor.copy(scanGlowColor).lerp(targetGlowColor, targetResolve);
        } else if (scanSignal > 0) {
          nextColor.copy(baseColors[i]).lerp(scanGlowColor, scanSignal);
        }
        nextColor.lerp(decisionColor, decisionStrength * 0.55);
      } else if (sinceTrigger >= SCAN_DECISION_DELAY) {
        nextColor.copy(scanGlowColor).lerp(rejectedColor, rejectProgress);
        if (rejectProgress > 0.82) {
          nextColor.lerp(hiddenColor, (rejectProgress - 0.82) / 0.18);
        }
      } else if (scanSignal > 0) {
        nextColor.copy(baseColors[i]).lerp(scanGlowColor, scanSignal);
      }

      currentColor.lerp(nextColor, 0.26);
      meshRef.current.setColorAt(i, currentColor);

      if (scanSignal > strongestPulse) {
        strongestPulse = scanSignal;
        activePulsePosition.copy(data.position);
      }
    }

    if (scanPulseRef.current) {
      const pulseVisible = strongestPulse > 0.08 && decisionStrength < 0.9;
      scanPulseRef.current.visible = pulseVisible;
      scanPulseRef.current.position.copy(activePulsePosition);
      scanPulseRef.current.position.z += 0.08;
      const pulseScale = 0.85 + (1 - strongestPulse) * 0.65;
      scanPulseRef.current.scale.setScalar(pulseScale);
      const pulseMaterial = scanPulseRef.current.material as THREE.MeshBasicMaterial;
      pulseMaterial.opacity = strongestPulse * 0.85;
    }

    if (decisionGroupRef.current) {
      decisionGroupRef.current.visible = decisionStrength > 0.01 || zoomProgress > 0.01;
      decisionGroupRef.current.position.copy(targetFocusPosition);
      decisionGroupRef.current.position.z += 0.12;
      const decisionPulse = 1 + Math.sin(state.clock.elapsedTime * 7.5) * 0.03;
      decisionGroupRef.current.scale.setScalar((1 + decisionStrength * 0.36 + zoomProgress * 0.2) * decisionPulse);

      if (decisionLightRef.current) {
        decisionLightRef.current.position.set(0, 0, 0.25);
        decisionLightRef.current.intensity = 10 * decisionStrength + 3 * zoomProgress;
      }

      for (const child of decisionGroupRef.current.children) {
        if (!(child instanceof THREE.Mesh)) continue;
        const material = child.material as THREE.MeshBasicMaterial;
        material.opacity = child.name === "decision-core"
          ? 0.18 + decisionStrength * 0.42 + zoomProgress * 0.12
          : decisionStrength * 0.75;
      }
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }

    if (groupRef.current) {
      groupRef.current.position.y = THREE.MathUtils.lerp(0.25, 0, zoomProgress);
      groupRef.current.position.z = THREE.MathUtils.lerp(0, 1.75, zoomProgress);
    }
  });

  return (
    <>
      <color attach="background" args={["#030308"]} />
      <fog attach="fog" args={["#030308", 9, 56]} />

      <ambientLight intensity={0.34} color="#ffffff" />
      <directionalLight position={[10, 20, 15]} intensity={1.18} color="#dbe7ff" />
      <spotLight position={[0, 0, 18]} intensity={3.9} angle={0.3} penumbra={1} color="#7edcff" distance={40} />
      <pointLight position={[0, 0, 6]} intensity={0.55} color="#ffffff" distance={28} />

      <Environment preset="city" />

      <group ref={groupRef}>
        <group ref={beamGroupRef} visible={false}>
          <mesh ref={beamCoreRef}>
            <planeGeometry args={[4.2, 0.18]} />
            <meshBasicMaterial
              color="#8dfeff"
              transparent
              opacity={0.94}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>

          <mesh ref={beamHaloRef}>
            <planeGeometry args={[6.8, 1.05]} />
            <meshBasicMaterial
              color="#2ddbff"
              transparent
              opacity={0.34}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>

          <mesh ref={beamSpillRef}>
            <planeGeometry args={[9.2, 3.4]} />
            <meshBasicMaterial
              color="#155dff"
              transparent
              opacity={0.13}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>

          <pointLight ref={beamLightRef} color="#7efaff" distance={10} decay={1.2} intensity={0} />
          <pointLight ref={beamLightWideRef} color="#2759ff" distance={18} decay={1.4} intensity={0} />
        </group>

        <mesh ref={scanPulseRef} visible={false}>
          <ringGeometry args={[0.34, 0.62, 48]} />
          <meshBasicMaterial
            color="#8cffff"
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>

        <group ref={decisionGroupRef} visible={false}>
          <mesh name="decision-core">
            <planeGeometry args={[2.45, 3.2]} />
            <meshBasicMaterial
              color="#8fffe4"
              transparent
              opacity={0}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh name="decision-ring">
            <ringGeometry args={[1.15, 1.45, 64]} />
            <meshBasicMaterial
              color="#d9ffff"
              transparent
              opacity={0}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
          <pointLight ref={decisionLightRef} color="#b8fff2" distance={14} decay={1.3} intensity={0} />
        </group>

        <instancedMesh ref={meshRef} args={[undefined as never, undefined as never, CARD_COUNT]}>
          <boxGeometry args={[1.6, 2.2, 0.04]} />
          <meshStandardMaterial
            color="#ffffff"
            map={resumeTexture || undefined}
            roughness={0.38}
            metalness={0.18}
            emissive="#18263b"
            emissiveIntensity={0.2}
            envMapIntensity={1}
          />
        </instancedMesh>
      </group>
    </>
  );
}
