import * as THREE from 'three';

interface FormArtifactGroup extends THREE.Group {
  dispose: () => void;
  update: (elapsed: number, delta: number) => void;
  heartbeat: number;
}

const GOLD = 0xD4AF37;
const GOLD_DARK = 0x8B6914;
const OBSIDIAN = 0x0a0a14;

export function createFormArtifact(): FormArtifactGroup {
  const group = new THREE.Group() as FormArtifactGroup;
  group.userData.type = 'form';
  group.scale.set(0, 0, 0);

  const disposables: { dispose: () => void }[] = [];

  // Torus 1 (Gold)
  const torus1Geo = new THREE.TorusGeometry(1.2, 0.15, 24, 64);
  const torus1Mat = new THREE.MeshStandardMaterial({
    color: GOLD, metalness: 0.9, roughness: 0.2,
    emissive: GOLD, emissiveIntensity: 0.15,
  });
  const torus1 = new THREE.Mesh(torus1Geo, torus1Mat);
  torus1.rotation.x = Math.PI / 4;
  disposables.push(torus1Geo, torus1Mat);
  group.add(torus1);

  // Torus 2 (Obsidian)
  const torus2Geo = new THREE.TorusGeometry(1.0, 0.12, 24, 64);
  const torus2Mat = new THREE.MeshStandardMaterial({
    color: OBSIDIAN, metalness: 0.7, roughness: 0.3,
    emissive: GOLD_DARK, emissiveIntensity: 0.08,
  });
  const torus2 = new THREE.Mesh(torus2Geo, torus2Mat);
  torus2.rotation.x = -Math.PI / 4;
  torus2.rotation.z = Math.PI / 2;
  disposables.push(torus2Geo, torus2Mat);
  group.add(torus2);

  // Crystalline knot
  const knotGeo = new THREE.IcosahedronGeometry(0.25, 1);
  const knotMat = new THREE.MeshStandardMaterial({
    color: GOLD, metalness: 1.0, roughness: 0.1,
    emissive: GOLD, emissiveIntensity: 0.3, wireframe: true,
  });
  const knot = new THREE.Mesh(knotGeo, knotMat);
  disposables.push(knotGeo, knotMat);
  group.add(knot);

  // Orbital lines
  const ringGeo = new THREE.RingGeometry(1.6, 1.62, 64);
  const ringMat = new THREE.MeshBasicMaterial({
    color: GOLD, side: THREE.DoubleSide, transparent: true, opacity: 0.1,
  });
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = (Math.PI / 3) * i;
    ring.rotation.y = (Math.PI / 5) * i;
    group.add(ring);
  }
  disposables.push(ringGeo, ringMat);

  // Point light
  const light = new THREE.PointLight(GOLD, 2, 8);
  light.position.set(0, 0, 0.5);
  group.add(light);

  // Animation state
  group.heartbeat = 0;

  group.update = (elapsed: number, _delta: number) => {
    torus1.rotation.y = elapsed * 0.3;
    torus2.rotation.y = -elapsed * 0.25;
    knot.rotation.y = elapsed * 0.5;
    knot.rotation.x = elapsed * 0.3;

    const pulse = 1 + group.heartbeat * 0.3 * Math.sin(elapsed * 4);
    torus1Mat.emissiveIntensity = 0.15 * pulse;
    knotMat.emissiveIntensity = 0.3 * pulse;
    light.intensity = 2 + group.heartbeat * Math.sin(elapsed * 4);
  };

  group.dispose = () => {
    disposables.forEach((d) => d.dispose());
  };

  return group;
}
