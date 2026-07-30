'use client';

import { useRef, Suspense, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Stats } from '@react-three/drei';
import * as THREE from 'three';
import { cn } from '@/lib/utils';

interface LiquidMorphProps {
  color?: string;
  speed?: number;
  complexity?: number;
  scale?: number;
  className?: string;
}

function MorphBlob({
  color = '#0077B6',
  speed = 0.3,
  complexity = 3,
  scale = 1,
}: Omit<LiquidMorphProps, 'className'>) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const mouseRef = useRef({ x: 0, y: 0 });

  const colors = useMemo(() => {
    return [new THREE.Color('#0077B6'), new THREE.Color('#10B981'), new THREE.Color('#F59E0B')];
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;

    const t = state.clock.elapsedTime * speed;
    const hue = (Math.sin(t * 0.1) + 1) * 0.5;
    const blended = colors[0].clone().lerp(colors[1], hue * 0.6);

    (meshRef.current.material as THREE.MeshStandardMaterial).color.set(blended);

    const targetX = mouseRef.current.x * 0.3;
    const targetY = mouseRef.current.y * 0.3;
    meshRef.current.position.x += (targetX - meshRef.current.position.x) * 0.02;
    meshRef.current.position.y += (targetY - meshRef.current.position.y) * 0.02;

    meshRef.current.rotation.x = Math.sin(t * 0.2) * 0.1;
    meshRef.current.rotation.y = Math.cos(t * 0.15) * 0.1;
  });

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouse, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouse);
  }, []);

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <mesh ref={meshRef} scale={scale}>
        <sphereGeometry args={[1, 64, 64]} />
        <MeshDistortMaterial
          color={color}
          speed={speed * 2}
          distort={0.3 + complexity * 0.05}
          radius={1}
          transparent
          opacity={0.85}
          roughness={0.1}
          metalness={0.2}
          envMapIntensity={0.5}
        />
      </mesh>
    </Float>
  );
}

export function LiquidMorph({
  color = '#0077B6',
  speed = 0.3,
  complexity = 3,
  scale = 1,
  className,
}: LiquidMorphProps) {
  return (
    <div className={cn('pointer-events-none fixed inset-0 z-0', className)}>
      <Canvas
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        camera={{ position: [0, 0, 4], fov: 60 }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <pointLight position={[5, 5, 5]} intensity={1} />
          <pointLight position={[-5, -5, -5]} intensity={0.5} color="#10B981" />
          <MorphBlob color={color} speed={speed} complexity={complexity} scale={scale} />
          {process.env.NODE_ENV === 'development' && <Stats />}
        </Suspense>
      </Canvas>
    </div>
  );
}
