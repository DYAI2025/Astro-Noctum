// ═══════════════════════════════════════════════════════════════════════════════
// ADVANCED MATERIALS & SHADERS
// Enhanced visual materials for planets, stars, and celestial objects
// Ported from 3DSolarSystem_animation reference implementation
// ═══════════════════════════════════════════════════════════════════════════════

import * as THREE from 'three';

// ─── Sun Material ─────────────────────────────────────────────────────────────

export function createSunMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      time:   { value: 0 },
      color1: { value: new THREE.Color('#FFF5E0') },
      color2: { value: new THREE.Color('#FFD700') },
      color3: { value: new THREE.Color('#FFA500') },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 color1, color2, color3;
      varying vec2 vUv;
      varying vec3 vNormal;
      float random(vec2 st) { return fract(sin(dot(st, vec2(12.9898,78.233))) * 43758.5453); }
      float noise(vec2 st) {
        vec2 i = floor(st); vec2 f = fract(st);
        float a = random(i), b = random(i+vec2(1,0)), c = random(i+vec2(0,1)), d = random(i+vec2(1,1));
        vec2 u = f*f*(3.0-2.0*f);
        return mix(a,b,u.x)+(c-a)*u.y*(1.0-u.x)+(d-b)*u.x*u.y;
      }
      void main() {
        vec2 nc = vUv*8.0 + time*0.05;
        float n = noise(nc), n2 = noise(nc*2.0 + vec2(time*0.03,0));
        float rim = 1.0 - abs(dot(vNormal, vec3(0,0,1)));
        rim = pow(rim, 2.0);
        vec3 col = mix(color1, color2, n*0.5+0.5);
        col = mix(col, color3, n2*0.3);
        col += vec3(1,0.9,0.7) * step(0.85, n) * 0.3;
        col += vec3(1,0.6,0.2) * rim * 0.5;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
}

// ─── Planet Material ──────────────────────────────────────────────────────────

export function createPlanetMaterial(
  color: string, emissiveIntensity = 0.1, roughness = 0.7, metalness = 0.1
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness, metalness,
    emissive: new THREE.Color(color),
    emissiveIntensity,
  });
}

// ─── Atmosphere Shader ────────────────────────────────────────────────────────

export function createAtmosphereShader(color: string, glowIntensity = 0.8): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      color:     { value: new THREE.Color(color) },
      intensity: { value: glowIntensity },
    },
    vertexShader: `
      varying vec3 vNormal; varying vec3 vPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelViewMatrix * vec4(position,1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color; uniform float intensity;
      varying vec3 vNormal; varying vec3 vPosition;
      void main() {
        vec3 viewDir = normalize(-vPosition);
        float rim = 1.0 - max(0.0, dot(viewDir, vNormal));
        rim = pow(rim, 3.0);
        gl_FragColor = vec4(color * rim * intensity, rim * intensity * 0.6);
      }
    `,
    transparent: true, side: THREE.BackSide,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
}

// ─── Saturn Rings ─────────────────────────────────────────────────────────────

export function createSaturnRingsMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      innerRadius: { value: 1.4 },
      outerRadius: { value: 2.2 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
    `,
    fragmentShader: `
      varying vec2 vUv;
      float random(vec2 st) { return fract(sin(dot(st, vec2(12.9898,78.233))) * 43758.5453); }
      void main() {
        vec2 center = vUv - 0.5;
        float dist = length(center) * 2.0;
        float bands = sin(dist*60.0)*0.5+0.5;
        float bands2 = sin(dist*120.0+0.5)*0.3+0.7;
        float cassini = smoothstep(0.73,0.75,dist)*(1.0-smoothstep(0.75,0.77,dist));
        vec3 col = vec3(0.85,0.77,0.65) * bands * bands2 * (1.0-cassini*0.7);
        col += random(vUv*100.0)*0.15;
        float edgeFade = smoothstep(0.0,0.1,dist)*(1.0-smoothstep(0.9,1.0,dist));
        float opacity = 0.85*bands*bands2*edgeFade*(1.0-cassini*0.5);
        gl_FragColor = vec4(col, opacity);
      }
    `,
    transparent: true, side: THREE.DoubleSide, depthWrite: false,
  });
}

// ─── Sky Dome Shader (Planetarium) ────────────────────────────────────────────

export function createSkyDomeShader(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPosition = wp.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition).y;
        vec3 zenith = vec3(0.02, 0.02, 0.08);
        vec3 nightSky = vec3(0.02, 0.02, 0.06);
        vec3 horizonWest = vec3(0.4, 0.15, 0.1);
        vec3 horizonEast = vec3(0.35, 0.25, 0.15);
        float horizonBlend = smoothstep(-0.1, 0.3, h);
        float eastWest = (normalize(vWorldPosition).x + 1.0) * 0.5;
        vec3 horizonColor = mix(horizonWest, horizonEast, eastWest);
        vec3 finalColor = mix(horizonColor, nightSky, horizonBlend);
        finalColor = mix(finalColor, zenith, smoothstep(0.3, 0.8, h));
        float haze = 1.0 - smoothstep(0.0, 0.15, h);
        finalColor += vec3(0.08, 0.06, 0.04) * haze * 0.5;
        float stars = fract(sin(dot(normalize(vWorldPosition).xz*1000.0, vec2(12.9898,78.233)))*43758.5453);
        if (h > 0.2 && stars > 0.998) finalColor += vec3(1.0)*(1.0-h)*0.3;
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
    side: THREE.BackSide, depthWrite: false,
  });
}

// ─── Ground Shader (Planetarium) ──────────────────────────────────────────────

export function createGroundShader(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
    `,
    fragmentShader: `
      varying vec2 vUv;
      void main() {
        float dist = length(vUv - 0.5) * 2.0;
        vec3 center = vec3(0.02, 0.02, 0.03);
        vec3 edge = vec3(0.08, 0.06, 0.05);
        vec3 color = mix(center, edge, dist);
        float alpha = smoothstep(1.0, 0.8, dist) * 0.95;
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true, side: THREE.DoubleSide, depthWrite: false,
  });
}

// ─── Milky Way Background ─────────────────────────────────────────────────────

export function createMilkyWayBackground(scene: THREE.Scene): void {
  const positions: number[] = [];
  const colors: number[] = [];
  for (let i = 0; i < 15000; i++) {
    const theta = Math.random() * Math.PI * 2;
    let phi = Math.acos(2 * Math.random() - 1);
    if (Math.random() > 0.3) phi = Math.PI / 2 + (Math.random() - 0.5) * 0.3;
    const r = 450 + Math.random() * 100;
    positions.push(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi),
    );
    const color = new THREE.Color();
    color.setHSL(0.55 + Math.random() * 0.15, 0.1 + Math.random() * 0.2, 0.7 + Math.random() * 0.3);
    colors.push(color.r, color.g, color.b);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
    size: 1.2, vertexColors: true, transparent: true, opacity: 0.8,
    sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false,
  })));
}

// ─── Earth Day/Night Shader ───────────────────────────────────────────────────

export function createEarthDayNightMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      sunDirection: { value: new THREE.Vector3(1, 0, 0) },
      time:         { value: 0 },
    },
    vertexShader: `
      varying vec3 vWorldNormal, vWorldPos;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec4 wPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = wPos.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 sunDirection;
      uniform float time;
      varying vec3 vWorldNormal, vWorldPos;
      varying vec2 vUv;
      float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
      float noise(vec2 p) {
        vec2 i=floor(p),f=fract(p);
        float a=hash2(i),b=hash2(i+vec2(1,0)),c=hash2(i+vec2(0,1)),d=hash2(i+vec2(1,1));
        vec2 u=f*f*(3.-2.*f);
        return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);
      }
      float fbm(vec2 p) { return noise(p)*0.5+noise(p*2.)*0.25+noise(p*4.)*0.125; }
      void main() {
        float illum = dot(vWorldNormal, normalize(sunDirection));
        float term = smoothstep(-0.08, 0.18, illum);
        float landRaw = fbm(vUv*vec2(5.5,4.5)+0.3);
        float landMask = smoothstep(0.44,0.58,landRaw);
        float coast = smoothstep(0.40,0.45,landRaw)*(1.0-landMask);
        float desert = smoothstep(0.62,0.72,noise(vUv*vec2(3,4.5)+1.7))*landMask;
        float lat = abs(vUv.y-0.5)*2.0;
        float ice = smoothstep(0.72,0.87,lat);
        float cloud = smoothstep(0.58,0.72,noise(vUv*vec2(4,3.5)+vec2(time*0.003,0)));
        vec3 ocean=vec3(0.08,0.25,0.58), land=vec3(0.18,0.40,0.14);
        vec3 sandy=vec3(0.68,0.58,0.32), polar=vec3(0.88,0.92,0.96), cloudC=vec3(0.92,0.94,0.97);
        vec3 day = mix(ocean, land, landMask);
        day = mix(day, ocean*1.25, coast*0.6);
        day = mix(day, sandy, desert);
        day = mix(day, polar, ice);
        day = mix(day, cloudC, cloud*0.85);
        day *= 0.35+0.65*max(0.0,illum*1.1-0.05);
        vec3 nightBase = vec3(0.007,0.007,0.018);
        float city1 = step(0.84,noise(vUv*22.0))*landMask*(1.-ice);
        float city2 = step(0.91,noise(vUv*45.0+0.6))*landMask*(1.-ice);
        vec3 night = nightBase + city1*vec3(0.80,0.65,0.30)*0.13 + city2*vec3(0.90,0.80,0.50)*0.07;
        vec3 fc = mix(night, day, term);
        vec3 half_v = normalize(sunDirection+normalize(cameraPosition-vWorldPos));
        float spec = pow(max(0.,dot(vWorldNormal,half_v)),60.0);
        fc += (1.-landMask)*(1.-cloud)*spec*0.18*term;
        gl_FragColor = vec4(fc, 1.0);
      }
    `,
  });
}

export function updateEarthSunDirection(
  mat: THREE.ShaderMaterial,
  earthPos: THREE.Vector3,
  sunPos: THREE.Vector3 = new THREE.Vector3(0, 0, 0),
): void {
  const dir = sunPos.clone().sub(earthPos).normalize();
  mat.uniforms.sunDirection.value.copy(dir);
  mat.uniforms.time.value += 0.016;
}

// ─── Star Sprite Texture ──────────────────────────────────────────────────────

export function createStarSpriteTexture(magnitude: number): THREE.CanvasTexture {
  const SIZE = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;
  const cx = SIZE / 2;

  let r = 255, g = 248, b = 235;
  if      (magnitude < -0.5) { r=180; g=210; b=255; }
  else if (magnitude <  0.5) { r=210; g=230; b=255; }
  else if (magnitude <  1.5) { r=255; g=252; b=245; }
  else if (magnitude <  2.5) { r=255; g=245; b=215; }
  else                       { r=255; g=230; b=195; }

  const grad = ctx.createRadialGradient(cx,cx,0, cx,cx,cx);
  grad.addColorStop(0.00, `rgba(${r},${g},${b},1.0)`);
  grad.addColorStop(0.08, `rgba(${r},${g},${b},0.95)`);
  grad.addColorStop(0.20, `rgba(${r},${g},${b},0.60)`);
  grad.addColorStop(0.45, `rgba(${r},${g},${b},0.15)`);
  grad.addColorStop(0.80, `rgba(${r},${g},${b},0.02)`);
  grad.addColorStop(1.00, `rgba(0,0,0,0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, SIZE, SIZE);

  if (magnitude < 2.0) {
    const spikeLen = magnitude < 0 ? cx*0.95 : magnitude < 1 ? cx*0.70 : cx*0.45;
    const alpha    = magnitude < 0 ? 0.45    : magnitude < 1 ? 0.28    : 0.15;
    ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
    ctx.lineWidth   = magnitude < 0 ? 1.5 : 1.0;
    ctx.beginPath();
    ctx.moveTo(cx-spikeLen, cx); ctx.lineTo(cx+spikeLen, cx);
    ctx.moveTo(cx, cx-spikeLen); ctx.lineTo(cx, cx+spikeLen);
    ctx.stroke();
    if (magnitude < 0.5) {
      const diag = spikeLen * 0.55;
      ctx.globalAlpha = 0.18;
      ctx.beginPath();
      ctx.moveTo(cx-diag, cx-diag); ctx.lineTo(cx+diag, cx+diag);
      ctx.moveTo(cx+diag, cx-diag); ctx.lineTo(cx-diag, cx+diag);
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }
  }
  return new THREE.CanvasTexture(canvas);
}

// ─── Update Loop ──────────────────────────────────────────────────────────────

export function updateMaterials(delta: number, sunMaterial?: THREE.ShaderMaterial): void {
  if (sunMaterial?.uniforms.time) {
    sunMaterial.uniforms.time.value += delta;
  }
}
