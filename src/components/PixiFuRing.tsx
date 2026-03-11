import { useRef, useEffect } from 'react';
import * as PIXI from 'pixi.js';
import 'pixi.js/unsafe-eval';

// ---------------------------------------------------------------------------
// Constants & Shaders
// ---------------------------------------------------------------------------

const SECTOR_COLORS_RAW = [
  '#E63946', '#C9A227', '#E9C46A', '#A8DADC', '#F4A261', '#6B9080',
  '#D4A5A5', '#9B2335', '#7B2D8E', '#2B2D42', '#00B4D8', '#48BFE3'
];

const SECTOR_COLORS_FLAT = SECTOR_COLORS_RAW.flatMap(hex => {
  const c = new PIXI.Color(hex);
  return [c.red, c.green, c.blue];
});

const VERTEX_SHADER = `
  attribute vec2 aPosition;
  attribute vec2 aUv;

  uniform mat3 uProjectionMatrix;
  uniform mat3 uWorldTransformMatrix;

  varying vec2 vUv;

  void main() {
    gl_Position = vec4((uProjectionMatrix * uWorldTransformMatrix * vec3(aPosition, 1.0)).xy, 0.0, 1.0);
    vUv = aUv;
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;

  varying vec2 vUv;

  uniform float uTime;
  uniform float uSignals[12];
  uniform vec3 uColors[12];

  #define PI 3.14159265359

  float smoothStepInterpolate(float signals[12], float angle) {
    float normalized = (angle / (2.0 * PI)) * 12.0;
    int left = int(floor(normalized)) % 12;
    int right = (left + 1) % 12;
    float t = normalized - floor(normalized);
    float smoothT = t * t * (3.0 - 2.0 * t);
    
    float valL = 0.0;
    float valR = 0.0;
    
    for(int i = 0; i < 12; i++) {
      if(i == left) valL = signals[i];
      if(i == right) valR = signals[i];
    }
    
    return mix(valL, valR, smoothT);
  }

  vec3 colorAtAngle(vec3 colors[12], float angle) {
    float normalized = (angle / (2.0 * PI)) * 12.0;
    int left = int(floor(normalized)) % 12;
    int right = (left + 1) % 12;
    float t = normalized - floor(normalized);
    float smoothT = t * t * (3.0 - 2.0 * t);
    
    vec3 colL = vec3(0.0);
    vec3 colR = vec3(0.0);
    
    for(int i = 0; i < 12; i++) {
      if(i == left) colL = colors[i];
      if(i == right) colR = colors[i];
    }
    
    return mix(colL, colR, smoothT);
  }

  void main() {
    // Center UVs: 0.0 to 1.0 -> -1.0 to 1.0
    vec2 uv = vUv * 2.0 - 1.0;
    float dist = length(uv);
    
    // Pixi Y is down, so we flip or adjust angle calc
    float angle = atan(uv.y, uv.x) + PI / 2.0;
    if (angle < 0.0) angle += 2.0 * PI;
    if (angle > 2.0 * PI) angle -= 2.0 * PI;

    float signal = smoothStepInterpolate(uSignals, angle);
    vec3 baseColor = colorAtAngle(uColors, angle);

    // Animation: Breathing
    float breathing = 1.0 + 0.02 * sin(uTime * 1.5 + angle * 2.0) * (0.3 + signal * 0.7);
    
    // Geometry
    float innerR = 0.45;
    float outerR = innerR + (0.45 * (0.3 + signal * 0.7)) * breathing;
    
    // Mask with smooth edges
    float ringMask = smoothstep(innerR - 0.01, innerR, dist) * smoothstep(outerR + 0.01, outerR, dist);
    
    // Visual Polish
    vec3 color = baseColor * (0.6 + signal * 0.4);
    float glow = exp(-pow(dist - (innerR + outerR) * 0.5, 2.0) * 50.0);
    color += baseColor * glow * 0.5;

    // IMPORTANT: PixiJS expects premultiplied alpha usually, 
    // but here we just ensure we output valid color.
    gl_FragColor = vec4(color * ringMask, ringMask);
  }
`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface PixiFuRingProps {
  signals: number[];
  size?: number;
  className?: string;
}

export default function PixiFuRing({
  signals,
  size = 400,
  className,
}: PixiFuRingProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const shaderRef = useRef<PIXI.Shader | null>(null);

  useEffect(() => {
    let active = true;

    const initPixi = async () => {
      if (!containerRef.current) return;

      const app = new PIXI.Application();
      try {
        await app.init({
          width: size,
          height: size,
          backgroundAlpha: 0,
          antialias: true,
          resolution: Math.min(window.devicePixelRatio, 2),
          autoDensity: true,
        });

        if (!active) {
          app.destroy(true, { children: true, texture: true, context: true });
          return;
        }

        appRef.current = app;
        containerRef.current.appendChild(app.canvas);

        // Quad Geometry
        const geometry = new PIXI.Geometry({
          attributes: {
            aPosition: [-1, -1, 1, -1, 1, 1, -1, 1],
            aUv: [0, 0, 1, 0, 1, 1, 0, 1],
          },
          indexBuffer: [0, 1, 2, 0, 2, 3],
        });

        // Use a simpler resource structure for compatibility
        const shader = PIXI.Shader.from({
          gl: {
            vertex: VERTEX_SHADER,
            fragment: FRAGMENT_SHADER,
          },
          resources: {
            // In v8, placing uniforms directly in resources often works best for WebGL 1 compat
            ringUniforms: new PIXI.UniformGroup({
              uTime: { value: 0, type: 'f32' },
              uSignals: { value: new Float32Array(signals), type: 'f32' },
              uColors: { value: new Float32Array(SECTOR_COLORS_FLAT), type: 'vec3' },
            }),
          }
        });

        shaderRef.current = shader;

        const mesh = new PIXI.Mesh({
          geometry,
          shader,
        });

        // Set mesh scale to half the size because geometry is -1 to 1 (width 2)
        mesh.scale.set(size / 2);
        mesh.position.set(size / 2);

        app.stage.addChild(mesh);

        app.ticker.add((ticker) => {
          if (shaderRef.current) {
            shaderRef.current.resources.ringUniforms.uniforms.uTime = ticker.lastTime / 1000;
          }
        });
      } catch (err) {
        console.error("PixiJS Init Failed:", err);
      }
    };

    initPixi();

    return () => {
      active = false;
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true, context: true });
        appRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update signals when props change
  useEffect(() => {
    if (shaderRef.current) {
      shaderRef.current.resources.ringUniforms.uniforms.uSignals = new Float32Array(signals);
    }
  }, [signals]);

  // Handle Resize
  useEffect(() => {
    if (appRef.current) {
      appRef.current.renderer.resize(size, size);
      // Meshes inside the stage don't auto-scale with the renderer unless we tell them
      appRef.current.stage.children.forEach(child => {
        if (child instanceof PIXI.Mesh) {
          child.scale.set(size / 2);
          child.position.set(size / 2);
        }
      });
    }
  }, [size]);

  return (
    <div 
      ref={containerRef} 
      className={className} 
      style={{ width: size, height: size, position: 'relative' }} 
    />
  );
}
