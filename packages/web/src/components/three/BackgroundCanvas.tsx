'use client';

import { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, type CameraProps } from '@react-three/fiber';
import { Stats } from '@react-three/drei';
import {
  EffectComposer,
  Bloom,
  Noise,
  Vignette,
} from '@react-three/postprocessing';
import { cn } from '@/lib/utils';
import * as THREE from 'three';

interface BackgroundCanvasProps {
  children: React.ReactNode;
  camera?: {
    position?: [number, number, number];
    fov?: number;
  };
  dpr?: number | [number, number];
  className?: string;
  effects?: {
    bloom?: boolean;
    noise?: boolean;
    vignette?: boolean;
  };
}

function EffectsLayer({
  bloom = false,
  noise = false,
  vignette = false,
}: {
  bloom?: boolean;
  noise?: boolean;
  vignette?: boolean;
}) {
  return (
    <EffectComposer>
      {bloom && (
        <Bloom
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          intensity={0.5}
          mipmapBlur
        />
      )}
      {noise && <Noise opacity={0.02} />}
      {vignette && <Vignette eskil={false} offset={0.3} darkness={0.5} />}
    </EffectComposer>
  );
}

export function BackgroundCanvas({
  children,
  camera = { position: [0, 0, 5], fov: 75 },
  dpr = [1, 2],
  className,
  effects = { bloom: false, noise: false, vignette: false },
}: BackgroundCanvasProps) {
  const [isVisible, setIsVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const cameraProps: CameraProps = {
    position: camera.position ?? [0, 0, 5],
    fov: camera.fov ?? 75,
    near: 0.1,
    far: 100,
  };

  return (
    <div
      ref={containerRef}
      className={cn('fixed inset-0 z-0', className)}
    >
      <Canvas
        dpr={dpr}
        camera={cameraProps}
        frameloop={isVisible ? 'always' : 'demand'}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
          toneMapping: THREE.ACESFilmicToneMapping,
        }}
        style={{ background: 'transparent' }}
        onCreated={({ gl }) => {
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={0.5} />
          {children}
          {(effects.bloom || effects.noise || effects.vignette) && (
            <EffectsLayer
              bloom={effects.bloom}
              noise={effects.noise}
              vignette={effects.vignette}
            />
          )}
          {process.env.NODE_ENV === 'development' && <Stats />}
        </Suspense>
      </Canvas>
    </div>
  );
}
