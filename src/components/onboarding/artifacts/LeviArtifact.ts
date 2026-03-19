import * as THREE from 'three';

interface LeviArtifactGroup extends THREE.Group {
  dispose: () => void;
  update: (elapsed: number, delta: number) => void;
  speaking: number;
}

const CYAN = 0x00F5FF;
const CYAN_DEEP = 0x00C5FF;

export function createLeviArtifact(): LeviArtifactGroup {
  const group = new THREE.Group() as LeviArtifactGroup;
  group.userData.type = 'levi';
  group.scale.set(0, 0, 0);

  const disposables: { dispose: () => void }[] = [];

  // Core sphere
  const sphereGeo = new THREE.SphereGeometry(0.8, 32, 32);
  const sphereMat = new THREE.MeshStandardMaterial({
    color: CYAN_DEEP, metalness: 0.2, roughness: 0.4,
    emissive: CYAN, emissiveIntensity: 0.4,
    transparent: true, opacity: 0.85,
  });
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);
  disposables.push(sphereGeo, sphereMat);
  group.add(sphere);

  // Inner glow
  const glowGeo = new THREE.SphereGeometry(0.85, 16, 16);
  const glowMat = new THREE.MeshBasicMaterial({
    color: CYAN, transparent: true, opacity: 0.12, side: THREE.BackSide,
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  disposables.push(glowGeo, glowMat);
  group.add(glow);

  // Orbital ring
  const ringGeo = new THREE.TorusGeometry(1.2, 0.03, 8, 64);
  const ringMat = new THREE.MeshBasicMaterial({
    color: CYAN, transparent: true, opacity: 0.3,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 3;
  disposables.push(ringGeo, ringMat);
  group.add(ring);

  // Orbiting dot
  const dotGeo = new THREE.SphereGeometry(0.06, 8, 8);
  const dotMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const dot = new THREE.Mesh(dotGeo, dotMat);
  disposables.push(dotGeo, dotMat);
  group.add(dot);

  // Point light
  const light = new THREE.PointLight(CYAN, 1.5, 6);
  light.position.set(0, 0, 0.3);
  group.add(light);

  // Animation state
  group.speaking = 0;

  group.update = (elapsed: number, _delta: number) => {
    sphere.position.y = Math.sin(elapsed * 1.5) * 0.05;
    ring.rotation.z = elapsed * 0.4;

    const angle = elapsed * 1.2;
    const radius = 1.2;
    dot.position.set(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius * Math.sin(Math.PI / 3),
      Math.sin(angle) * radius * Math.cos(Math.PI / 3),
    );

    const pulse = 1 + group.speaking * 0.25 * Math.sin(elapsed * 6);
    sphereMat.emissiveIntensity = 0.4 * pulse;
    glowMat.opacity = 0.12 * pulse;
    light.intensity = 1.5 + group.speaking * Math.sin(elapsed * 6) * 0.5;

    if (group.speaking > 0) {
      sphere.scale.setScalar(1 + Math.sin(elapsed * 6) * 0.02 * group.speaking);
    } else {
      sphere.scale.setScalar(1);
    }
  };

  group.dispose = () => {
    disposables.forEach((d) => d.dispose());
  };

  return group;
}
