import { Html, Line } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';

import type {
  DebugDisplayModes,
  DebugTriggerNode,
  FusionVisualState,
} from './testFieldTypes';

type TestFieldOverlayProps = {
  visualState: FusionVisualState;
  triggerNodes: DebugTriggerNode[];
  displayModes: DebugDisplayModes;
  effectiveMagnetFlow: number;
  effectiveSpaceDensity: number;
  effectivePairCoherence: number;
  pairDistance: number;
  dischargeFrequency: number;
  mergeBias: number;
};

type PairField = {
  left: THREE.Vector3;
  right: THREE.Vector3;
  mid: THREE.Vector3;
  angle: number;
  length: number;
};

type RenderLine = {
  key: string;
  points: [number, number, number][];
  color: string;
  opacity: number;
};

const RING_RADIUS = 3.35;
const STATE_BLEND: Record<FusionVisualState, number> = {
  IDLE: 0,
  PRIMED: 0.2,
  CHARGING: 0.45,
  POLARIZING: 0.7,
  PAIRING: 1,
  STABILIZING: 0.6,
};

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const sectorToAngle = (sector: number): number => (sector / 12) * Math.PI * 2 - Math.PI / 2;

const pointOnRing = (sector: number, radius: number): THREE.Vector3 => {
  const angle = sectorToAngle(sector);
  return new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0.05);
};

const toTuple = (point: THREE.Vector3): [number, number, number] => [point.x, point.y, point.z];

const buildArcPoints = (
  start: THREE.Vector3,
  end: THREE.Vector3,
  bend: number,
): [number, number, number][] => {
  const mid = start.clone().add(end).multiplyScalar(0.5);
  const direction = end.clone().sub(start);
  if (direction.lengthSq() < 1e-6) {
    return [toTuple(start), toTuple(end)];
  }
  const normal = new THREE.Vector3(-direction.y, direction.x, 0).normalize();
  const ctrl = mid.add(normal.multiplyScalar(bend));

  const points: [number, number, number][] = [];
  const steps = 10;

  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const omt = 1 - t;
    const p = new THREE.Vector3(
      omt * omt * start.x + 2 * omt * t * ctrl.x + t * t * end.x,
      omt * omt * start.y + 2 * omt * t * ctrl.y + t * t * end.y,
      omt * omt * start.z + 2 * omt * t * ctrl.z + t * t * end.z,
    );
    points.push(toTuple(p));
  }

  return points;
};

const triggerColor = (kind: DebugTriggerNode['kind']): string => {
  return kind === 'contribution' ? '#F4D67F' : '#7FD6FF';
};

const triggerLabel = (kind: DebugTriggerNode['kind']): string => {
  return kind === 'contribution' ? 'C' : 'T';
};

export const TestFieldOverlay = ({
  visualState,
  triggerNodes,
  displayModes,
  effectiveMagnetFlow,
  effectiveSpaceDensity,
  effectivePairCoherence,
  pairDistance,
  dischargeFrequency,
  mergeBias,
}: TestFieldOverlayProps) => {
  const stateBlend = STATE_BLEND[visualState] ?? 0;

  const triggerPoints = useMemo(() => {
    return triggerNodes.map((trigger) => {
      const base = pointOnRing(trigger.sector, RING_RADIUS + (trigger.kind === 'transit' ? 0.12 : 0));
      return {
        ...trigger,
        position: base,
        color: triggerColor(trigger.kind),
      };
    });
  }, [triggerNodes]);

  const pairField = useMemo<PairField>(() => {
    const baseAngle = triggerPoints.length
      ? triggerPoints.reduce((sum, trigger) => sum + sectorToAngle(trigger.sector), 0) / triggerPoints.length
      : -Math.PI / 2;

    const fieldRadius = 0.55 + (1 - mergeBias) * 0.2;
    const center = new THREE.Vector3(
      Math.cos(baseAngle) * fieldRadius,
      Math.sin(baseAngle) * fieldRadius,
      0.12,
    );

    const tangent = new THREE.Vector3(
      Math.cos(baseAngle + Math.PI / 2),
      Math.sin(baseAngle + Math.PI / 2),
      0,
    ).normalize();

    const halfDistance = Math.max(0.08, pairDistance * 0.5);
    const left = center.clone().addScaledVector(tangent, halfDistance);
    const right = center.clone().addScaledVector(tangent, -halfDistance);
    const angle = Math.atan2(right.y - left.y, right.x - left.x);

    return {
      left,
      right,
      mid: center,
      angle,
      length: left.distanceTo(right),
    };
  }, [mergeBias, pairDistance, triggerPoints]);

  const flowLines = useMemo<RenderLine[]>(() => {
    if (!displayModes.showFlowLines) return [];

    const lines: RenderLine[] = [];

    triggerPoints.forEach((trigger, index) => {
      const target = index % 2 === 0 ? pairField.left : pairField.right;
      lines.push({
        key: `flow-${trigger.id}`,
        points: buildArcPoints(trigger.position, target, 0.18 + effectiveMagnetFlow * 0.22),
        color: trigger.color,
        opacity: clamp01(0.18 + effectiveMagnetFlow * 0.55),
      });
    });

    const radialCount = Math.max(2, Math.round(2 + effectiveMagnetFlow * 5));
    for (let i = 0; i < radialCount; i += 1) {
      const sector = (i * 3) % 12;
      const source = pointOnRing(sector, RING_RADIUS - 0.1);
      const target = i % 2 === 0 ? pairField.left : pairField.right;
      lines.push({
        key: `field-${sector}-${i}`,
        points: buildArcPoints(source, target, 0.12 + effectiveMagnetFlow * 0.14),
        color: '#65EFD2',
        opacity: clamp01(0.08 + effectiveMagnetFlow * 0.4),
      });
    }

    return lines;
  }, [displayModes.showFlowLines, effectiveMagnetFlow, pairField.left, pairField.right, triggerPoints]);

  const dischargeLines = useMemo<RenderLine[]>(() => {
    if (visualState !== 'PAIRING' && visualState !== 'STABILIZING') return [];

    const lines: RenderLine[] = [];
    const count = Math.max(1, Math.round(1 + dischargeFrequency * 4));
    const dischargeAngles = [-Math.PI / 3, -Math.PI / 12, Math.PI / 4, Math.PI * 0.78, Math.PI * 1.15];

    for (let i = 0; i < count; i += 1) {
      const angle = dischargeAngles[i % dischargeAngles.length];
      const point = new THREE.Vector3(
        Math.cos(angle) * 2.35,
        Math.sin(angle) * 2.35,
        0.08,
      );
      const source = i % 2 === 0 ? pairField.left : pairField.right;

      lines.push({
        key: `discharge-${i}`,
        points: buildArcPoints(source, point, 0.22),
        color: '#FFC87A',
        opacity: clamp01(0.2 + dischargeFrequency * 0.55),
      });
    }

    return lines;
  }, [dischargeFrequency, pairField.left, pairField.right, visualState]);

  const densityRadius = 0.45 + effectiveSpaceDensity * 0.85 + effectiveMagnetFlow * 0.15;
  const pairingOpacity = clamp01(0.12 + stateBlend * 0.12 + effectivePairCoherence * 0.26);

  return (
    <group>
      {displayModes.showDensityMap ? (
        <>
          <mesh position={toTuple(pairField.mid)}>
            <sphereGeometry args={[densityRadius, 32, 32]} />
            <meshBasicMaterial color="#78D2FF" transparent opacity={0.04 + effectiveSpaceDensity * 0.15} depthWrite={false} />
          </mesh>

          <mesh position={toTuple(pairField.left)}>
            <sphereGeometry args={[0.22 + effectiveSpaceDensity * 0.12, 24, 24]} />
            <meshBasicMaterial color="#A7EAFF" transparent opacity={0.08 + effectiveSpaceDensity * 0.2} depthWrite={false} />
          </mesh>

          <mesh position={toTuple(pairField.right)}>
            <sphereGeometry args={[0.22 + effectiveSpaceDensity * 0.12, 24, 24]} />
            <meshBasicMaterial color="#9AE4E8" transparent opacity={0.08 + effectiveSpaceDensity * 0.2} depthWrite={false} />
          </mesh>
        </>
      ) : null}

      {displayModes.showPairingZones ? (
        <>
          <mesh position={toTuple(pairField.left)}>
            <sphereGeometry args={[0.12 + effectivePairCoherence * 0.1, 24, 24]} />
            <meshStandardMaterial color="#F5CF82" emissive="#C8974A" emissiveIntensity={0.25 + effectivePairCoherence * 0.4} transparent opacity={0.85} depthWrite={false} />
          </mesh>

          <mesh position={toTuple(pairField.right)}>
            <sphereGeometry args={[0.12 + effectivePairCoherence * 0.1, 24, 24]} />
            <meshStandardMaterial color="#8FD5FF" emissive="#4F93C8" emissiveIntensity={0.25 + effectivePairCoherence * 0.4} transparent opacity={0.85} depthWrite={false} />
          </mesh>

          <mesh
            position={toTuple(pairField.mid)}
            rotation={[0, 0, pairField.angle - Math.PI / 2]}
          >
            <cylinderGeometry args={[0.06, 0.06, pairField.length, 24]} />
            <meshBasicMaterial color="#FFF2D1" transparent opacity={pairingOpacity} depthWrite={false} />
          </mesh>
        </>
      ) : null}

      {flowLines.map((line) => (
        <Line
          key={line.key}
          points={line.points}
          color={line.color}
          transparent
          opacity={line.opacity}
          lineWidth={1.2}
        />
      ))}

      {dischargeLines.map((line) => (
        <Line
          key={line.key}
          points={line.points}
          color={line.color}
          transparent
          opacity={line.opacity}
          lineWidth={1.4}
        />
      ))}

      {displayModes.showTriggerPoints
        ? triggerPoints.map((trigger) => (
            <group key={trigger.id} position={toTuple(trigger.position)}>
              <mesh>
                <sphereGeometry args={[0.07 + trigger.strength * 0.06, 18, 18]} />
                <meshStandardMaterial
                  color={trigger.color}
                  emissive={trigger.color}
                  emissiveIntensity={0.4 + trigger.strength * 0.4}
                  transparent
                  opacity={0.9}
                  depthWrite={false}
                />
              </mesh>

              <Html center position={[0, 0.16, 0]}>
                <div className="pointer-events-none rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-mono text-white/85 shadow-lg">
                  {triggerLabel(trigger.kind)}{trigger.sector}
                </div>
              </Html>
            </group>
          ))
        : null}
    </group>
  );
};
