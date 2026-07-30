'use client';

import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stats } from '@react-three/drei';
import * as THREE from 'three';
import { cn } from '@/lib/utils';

interface ParticleBackgroundProps {
  count?: number;
  color?: string;
  size?: number;
  speed?: number;
  interactive?: boolean;
  className?: string;
}

function ParticleSystem({
  count = 2000,
  color = '#0077B6',
  size = 2,
  speed = 0.5,
  interactive = false,
}: Omit<ParticleBackgroundProps, 'className'>) {
  const pointsRef = useRef<THREE.Points>(null!);
  const mouseRef = useRef({ x: 0, y: 0 });
  const { viewport, size: viewSize } = useThree();

  const isMobile = viewSize.width < 768;
  const particleCount = isMobile ? Math.min(count, 500) : count;

  const [positions, colors, sizes] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);
    const siz = new Float32Array(particleCount);

    const brandColor = new THREE.Color(color);
    const accentColor = new THREE.Color('#10B981');

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const radius = 3 + Math.random() * 4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      pos[i3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i3 + 2] = radius * Math.cos(phi);

      const t = Math.random();
      const mixed = brandColor.clone().lerp(accentColor, t);
      col[i3] = mixed.r;
      col[i3 + 1] = mixed.g;
      col[i3 + 2] = mixed.b;

      siz[i] = size * (0.3 + Math.random() * 0.7);
    }

    return [pos, col, siz];
  }, [particleCount, color, size]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    return geo;
  }, [positions, colors, sizes]);

  useEffect(() => {
    if (!interactive) return;

    const handleMouse = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouse, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouse);
  }, [interactive]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;

    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const idx = i;

      const initialX = positions[i3];
      const initialY = positions[i3 + 1];
      const initialZ = positions[i3 + 2];

      const waveX = Math.sin(time * speed + idx * 0.1) * 0.1;
      const waveY = Math.cos(time * speed * 0.7 + idx * 0.15) * 0.1;
      const waveZ = Math.sin(time * speed * 0.5 + idx * 0.12) * 0.1;

      let offsetX = waveX;
      let offsetY = waveY;
      let offsetZ = waveZ;

      if (interactive) {
        const mx = mouseRef.current.x * 0.3;
        const my = mouseRef.current.y * 0.3;
        const dx = positions[i3] - mx * 2;
        const dy = positions[i3 + 1] - my * 2;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 2) {
          const force = (1 - dist / 2) * 0.2;
          offsetX += dx * force;
          offsetY += dy * force;
        }
      }

      positions[i3] += (initialX + offsetX - positions[i3]) * 0.02;
      positions[i3 + 1] += (initialY + offsetY - positions[i3 + 1]) * 0.02;
      positions[i3 + 2] += (initialZ + offsetZ - positions[i3 + 2]) * 0.02;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.rotation.y += delta * 0.03;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={size * 0.02}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export function ParticleBackground({
  count = 2000,
  color = '#0077B6',
  size = 2,
  speed = 0.5,
  interactive = false,
  className,
}: ParticleBackgroundProps) {
  return (
    <div className={cn('pointer-events-none fixed inset-0 z-0', className)}>
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 5], fov: 75 }}
        frameloop="demand"
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <ParticleSystem
            count={count}
            color={color}
            size={size}
            speed={speed}
            interactive={interactive}
          />
          {process.env.NODE_ENV === 'development' && <Stats />}
        </Suspense>
      </Canvas>
    </div>
  );
}
