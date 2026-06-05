"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uHover;
  uniform vec2 uMouse;
  varying vec2 vUv;
  varying float vDisplacement;

  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g  = step(x0.yzx, x0.xyz);
    vec3 l  = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 1.0/7.0;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x  = x_ * ns.x + ns.yyyy;
    vec4 y  = y_ * ns.x + ns.yyyy;
    vec4 h  = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }

  void main() {
    vUv = uv;
    vec3 pos = position;
    float noiseFreq = 1.5;
    float noiseAmp = 0.35;

    float mouseDist = length(vec2(uMouse) - pos.xy);
    float mouseInfluence = smoothstep(1.8, 0.0, mouseDist) * uHover * 0.15;

    float noise = snoise(pos * noiseFreq + uTime * 0.4);
    float displacement = noise * noiseAmp + mouseInfluence;

    vDisplacement = displacement;
    pos += normal * displacement;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  uniform float uOpacity;
  varying vec2 vUv;
  varying float vDisplacement;

  void main() {
    float t = clamp((vDisplacement + 0.35) / 0.7, 0.0, 1.0);
    vec3 color = mix(uColorA, uColorB, smoothstep(0.0, 0.5, t));
    color = mix(color, uColorC, smoothstep(0.5, 1.0, t));

    float rim = 1.0 - dot(normalize(vec3(0.0, 0.0, 1.0)), normalize(vec3(vUv - 0.5, 0.5)));
    color += rim * 0.08;

    gl_FragColor = vec4(color, uOpacity);
  }
`;

const TARGET_FPS = 30;
const FRAME_INTERVAL = 1 / TARGET_FPS;

function Blob({ reducedMotion }: { reducedMotion: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();
  const mouseRef = useRef(new THREE.Vector2(0, 0));
  const hoverRef = useRef(0);
  const accumRef = useRef(0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uHover: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uOpacity: { value: 0.9 },
      uColorA: { value: new THREE.Color("#3d2518") },
      uColorB: { value: new THREE.Color("#c8723a") },
      uColorC: { value: new THREE.Color("#e8c9a0") },
    }),
    []
  );

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Throttle to 30fps — accumulate delta, skip frames until interval met
    accumRef.current += delta;
    if (accumRef.current < FRAME_INTERVAL) return;
    accumRef.current = accumRef.current % FRAME_INTERVAL;

    if (!reducedMotion) {
      uniforms.uTime.value += FRAME_INTERVAL;
      meshRef.current.rotation.y += FRAME_INTERVAL * 0.08;
      meshRef.current.rotation.x += FRAME_INTERVAL * 0.04;
    }

    const pointer = state.pointer;
    mouseRef.current.x += (pointer.x * (viewport.width / 2) - mouseRef.current.x) * 0.05;
    mouseRef.current.y += (pointer.y * (viewport.height / 2) - mouseRef.current.y) * 0.05;
    uniforms.uMouse.value.set(mouseRef.current.x, mouseRef.current.y);

    const targetHover = pointer.x !== 0 || pointer.y !== 0 ? 1 : 0;
    hoverRef.current += (targetHover - hoverRef.current) * 0.03;
    uniforms.uHover.value = hoverRef.current;
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1.6, 24]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
      />
    </mesh>
  );
}

export function HeroBlob() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const reducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0.1,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="size-full">
      {visible && (
        <Canvas
          camera={{ position: [0, 0, 6.5], fov: 45 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
          style={{ pointerEvents: "auto" }}
        >
          <Blob reducedMotion={reducedMotion} />
        </Canvas>
      )}
    </div>
  );
}
