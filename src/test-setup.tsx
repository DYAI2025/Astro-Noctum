import "@testing-library/jest-dom";

// Mock Three.js (WebGL not available in happy-dom)
vi.mock("three", () => {
  const Vector3 = vi.fn().mockImplementation((x = 0, y = 0, z = 0) => ({
    x, y, z,
    set: vi.fn().mockReturnThis(),
    clone: vi.fn().mockReturnThis(),
    copy: vi.fn().mockReturnThis(),
    add: vi.fn().mockReturnThis(),
    divideScalar: vi.fn().mockReturnThis(),
    project: vi.fn().mockReturnThis(),
  }));
  return {
    WebGLRenderer: vi.fn().mockImplementation(() => ({
      setSize: vi.fn(), setPixelRatio: vi.fn(), setClearColor: vi.fn(),
      render: vi.fn(), dispose: vi.fn(),
      domElement: document.createElement("canvas"),
    })),
    Scene: vi.fn().mockImplementation(() => ({ add: vi.fn() })),
    PerspectiveCamera: vi.fn().mockImplementation(() => ({
      position: { set: vi.fn() }, lookAt: vi.fn(),
      aspect: 1, updateProjectionMatrix: vi.fn(),
    })),
    SphereGeometry: vi.fn(), BufferGeometry: vi.fn().mockImplementation(() => ({
      setAttribute: vi.fn().mockReturnThis(),
      setFromPoints: vi.fn().mockReturnThis(),
    })),
    Float32BufferAttribute: vi.fn(), MeshBasicMaterial: vi.fn().mockImplementation(() => ({
      color: { set: vi.fn() }, opacity: 1, needsUpdate: false,
    })),
    LineBasicMaterial: vi.fn().mockImplementation(() => ({
      color: { set: vi.fn() }, opacity: 1,
    })),
    PointsMaterial: vi.fn(), ShaderMaterial: vi.fn(),
    RingGeometry: vi.fn(), Mesh: vi.fn().mockImplementation(() => ({
      position: { set: vi.fn(), copy: vi.fn() },
      rotation: { x: 0 }, castShadow: false, add: vi.fn(),
      userData: {}, material: { color: { set: vi.fn() }, opacity: 1 },
    })),
    Points: vi.fn(), Line: vi.fn().mockImplementation(() => ({
      userData: {}, material: { color: { set: vi.fn() }, opacity: 1 },
    })),
    Group: vi.fn().mockImplementation(() => ({
      add: vi.fn(), visible: false, children: [],
    })),
    PointLight: vi.fn(), AmbientLight: vi.fn(), HemisphereLight: vi.fn(),
    Clock: vi.fn().mockImplementation(() => ({ getDelta: vi.fn().mockReturnValue(0.016) })),
    Vector3, AdditiveBlending: 2, BackSide: 1,
  };
});

// Mock BirthChartOrrery (requires WebGL)
vi.mock("./components/BirthChartOrrery", () => ({
  BirthChartOrrery: ({ birthDate, planetariumMode, birthConstellation }: any) => (
    <div
      data-testid="orrery"
      data-planetarium={planetariumMode}
      data-birth-constellation={birthConstellation}
    >
      Orrery [{birthDate?.toString()}]
    </div>
  ),
}));
