'use client';

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type {
  CartographyPoint,
  CartographyCluster,
  ColorByOption,
} from '@/lib/schemas/cartographie';
import { PIPELINE_COLORS } from '@/lib/cartographie/cartographie-service';

interface Cartography3DFiberProps {
  points: CartographyPoint[];
  clusters: CartographyCluster[];
  colorBy: ColorByOption;
  opacity: number;
  searchSkill: string;
  selectedClusterId: string | null;
  onSelectPoint: (point: CartographyPoint) => void;
  onHoverPoint: (point: CartographyPoint | null) => void;
}

interface InstancedPointsMeshProps {
  visiblePoints: CartographyPoint[];
  clusters: CartographyCluster[];
  colorBy: ColorByOption;
  opacity: number;
  searchSkill: string;
  prefersReducedMotion: boolean;
  onSelectPoint: (point: CartographyPoint) => void;
  onHoverPoint: (point: CartographyPoint | null) => void;
}

function InstancedPointsMesh({
  visiblePoints,
  clusters,
  colorBy,
  opacity,
  searchSkill,
  prefersReducedMotion,
  onSelectPoint,
  onHoverPoint,
}: InstancedPointsMeshProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const tempObject = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);

  // Déterminer la couleur d'un point
  const getPointColor = (p: CartographyPoint): string => {
    switch (colorBy) {
      case 'cluster': {
        const c = clusters.find((cl) => cl.id === p.clusterId);
        return c?.color || '#6366F1';
      }
      case 'pipeline': {
        return PIPELINE_COLORS[p.pipelineStage] || '#94A3B8';
      }
      case 'experience': {
        if (p.yearsExperience <= 2) return '#38BDF8';
        if (p.yearsExperience <= 5) return '#3B82F6';
        if (p.yearsExperience <= 8) return '#8B5CF6';
        return '#EC4899';
      }
      case 'folder': {
        if (p.folderId === 'fld-de-2026') return '#3B82F6';
        if (p.folderId === 'fld-cyb-88') return '#EF4444';
        return '#10B981';
      }
      default:
        return '#3B82F6';
    }
  };

  const skillQuery = searchSkill.trim().toLowerCase();

  // Mise à jour efficace des 50 000 instances sans re-rendu React individuel
  useEffect(() => {
    if (!meshRef.current) return;

    const count = visiblePoints.length;

    for (let i = 0; i < count; i++) {
      const p = visiblePoints[i];
      const matchesSearch =
        !skillQuery ||
        p.topSkills.some((s) => s.toLowerCase().includes(skillQuery)) ||
        (p.allSkills && p.allSkills.some((s) => s.toLowerCase().includes(skillQuery)));

      tempObject.position.set(p.x, p.y, p.z);
      const scaleFactor = matchesSearch ? (skillQuery ? 1.8 : 1.0) : 0.35;
      tempObject.scale.set(scaleFactor, scaleFactor, scaleFactor);
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);

      // Couleurs
      const hex = getPointColor(p);
      tempColor.set(hex);
      if (!matchesSearch) {
        tempColor.lerp(new THREE.Color('#334155'), 0.7);
      }
      meshRef.current.setColorAt(i, tempColor);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [visiblePoints, clusters, colorBy, skillQuery, tempObject, tempColor]);

  // Animation orbitale respectant prefers-reduced-motion
  useFrame((_, delta) => {
    if (!prefersReducedMotion && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, visiblePoints.length]}
        onPointerMove={(e) => {
          e.stopPropagation();
          if (e.instanceId !== undefined && visiblePoints[e.instanceId]) {
            onHoverPoint(visiblePoints[e.instanceId]);
          }
        }}
        onPointerLeave={() => {
          onHoverPoint(null);
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (e.instanceId !== undefined && visiblePoints[e.instanceId]) {
            onSelectPoint(visiblePoints[e.instanceId]);
          }
        }}
      >
        <sphereGeometry args={[0.12, 10, 10]} />
        <meshStandardMaterial
          roughness={0.3}
          metalness={0.2}
          transparent={true}
          opacity={opacity}
        />
      </instancedMesh>
    </group>
  );
}

export function Cartography3DFiber({
  points,
  clusters,
  colorBy,
  opacity,
  searchSkill,
  selectedClusterId,
  onSelectPoint,
  onHoverPoint,
}: Cartography3DFiberProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Détection automatique de prefers-reduced-motion
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, []);

  const visiblePoints = useMemo(() => {
    return selectedClusterId
      ? points.filter((p) => p.clusterId === selectedClusterId)
      : points;
  }, [points, selectedClusterId]);

  return (
    <div
      className="relative w-full h-full min-h-[500px] bg-slate-950 rounded-lg overflow-hidden select-none"
      data-testid="cartography-3d-container"
    >
      <Canvas
        camera={{ position: [0, 0, 13], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[10, 10, 10]} intensity={1.2} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />

        <InstancedPointsMesh
          visiblePoints={visiblePoints}
          clusters={clusters}
          colorBy={colorBy}
          opacity={opacity}
          searchSkill={searchSkill}
          prefersReducedMotion={prefersReducedMotion}
          onSelectPoint={onSelectPoint}
          onHoverPoint={onHoverPoint}
        />
      </Canvas>

      {/* Note d'interaction 3D */}
      <div className="absolute bottom-2 left-2 pointer-events-none bg-slate-900/80 backdrop-blur-xs text-[10px] text-slate-400 px-2 py-1 rounded border border-slate-800">
        Rotation 3D GPU ({visiblePoints.length.toLocaleString()} points) {prefersReducedMotion && '• Motion réduite'}
      </div>
    </div>
  );
}

export default Cartography3DFiber;
