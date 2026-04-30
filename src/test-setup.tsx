import "@testing-library/jest-dom";

// Mock Three.js (WebGL not available in happy-dom)
vi.mock("three", () => {
  const Color = vi.fn(function Color(this: { value: string }, value = "#000000") {
    this.value = value;
  });
  Color.prototype.clone = vi.fn(function clone(this: { value: string }) {
    return this;
  });
  Color.prototype.set = vi.fn(function set(this: { value: string }, value: string) {
    this.value = value;
    return this;
  });
  const Vector3 = vi.fn(function Vector3(this: any, x = 0, y = 0, z = 0) {
    this.x = x; this.y = y; this.z = z;
    this.set = vi.fn().mockReturnThis();
    this.clone = vi.fn().mockReturnThis();
    this.copy = vi.fn().mockReturnThis();
    this.add = vi.fn(function(this: any) { return this; });
    this.normalize = vi.fn(function(this: any) { return this; });
    this.divideScalar = vi.fn().mockReturnThis();
    this.project = vi.fn().mockReturnThis();
  });
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
    SphereGeometry: vi.fn(function SphereGeometry(this: any) { this.dispose = vi.fn(); }),
    BufferGeometry: vi.fn().mockImplementation(() => ({
      setAttribute: vi.fn().mockReturnThis(),
      setFromPoints: vi.fn().mockReturnThis(),
    })),
    Float32BufferAttribute: vi.fn(),
    MeshBasicMaterial: vi.fn(function MeshBasicMaterial(this: any) {
      this.color = { set: vi.fn() }; this.opacity = 1; this.needsUpdate = false; this.dispose = vi.fn();
    }),
    MeshStandardMaterial: vi.fn(function MeshStandardMaterial(this: any, params: any = {}) {
      this.color = { set: vi.fn() }; this.opacity = 1; this.needsUpdate = false; this.dispose = vi.fn();
      this.emissive = { set: vi.fn() }; this.emissiveIntensity = params.emissiveIntensity ?? 0;
    }),
    MeshPhysicalMaterial: vi.fn(function MeshPhysicalMaterial(this: any) {
      this.color = { set: vi.fn() }; this.opacity = 1; this.needsUpdate = false; this.dispose = vi.fn();
      this.emissive = { set: vi.fn() }; this.emissiveIntensity = 0;
    }),
    LineBasicMaterial: vi.fn().mockImplementation(() => ({
      color: { set: vi.fn() }, opacity: 1,
    })),
    PointsMaterial: vi.fn(),
    ShaderMaterial: vi.fn(function ShaderMaterial(this: any, params: any = {}) {
      this.uniforms = params.uniforms ?? {};
      this.vertexShader = params.vertexShader ?? '';
      this.fragmentShader = params.fragmentShader ?? '';
      this.transparent = params.transparent ?? false;
      this.userData = {};
      this.dispose = vi.fn();
      this.needsUpdate = false;
    }),
    TorusGeometry: vi.fn(function TorusGeometry(this: any) { this.dispose = vi.fn(); }),
    IcosahedronGeometry: vi.fn(function IcosahedronGeometry(this: any) { this.dispose = vi.fn(); }),
    RingGeometry: vi.fn(function RingGeometry(this: any) { this.dispose = vi.fn(); }),
    Mesh: vi.fn(function Mesh(this: any) {
      this.position = { set: vi.fn(), copy: vi.fn(), x: 0, y: 0, z: 0 };
      this.rotation = { x: 0, y: 0, z: 0 };
      this.scale = { x: 1, y: 1, z: 1, setScalar(s: number) { this.x = s; this.y = s; this.z = s; } };
      this.castShadow = false;
      this.add = vi.fn();
      this.userData = {};
      this.material = { color: { set: vi.fn() }, opacity: 1 };
    }),
    Points: vi.fn(), Line: vi.fn(function Line(this: any) {
      this.userData = {};
      this.material = { color: { set: vi.fn() }, opacity: 1 };
    }),
    Group: vi.fn(function Group(this: any) {
      this.add = vi.fn();
      this.visible = true;
      this.children = [];
      this.scale = { x: 1, y: 1, z: 1, set(x: number, y: number, z: number) { this.x = x; this.y = y; this.z = z; }, setScalar(s: number) { this.x = s; this.y = s; this.z = s; } };
      this.rotation = { x: 0, y: 0, z: 0 };
      this.position = { x: 0, y: 0, z: 0, set(x: number, y: number, z: number) { this.x = x; this.y = y; this.z = z; }, copy: vi.fn() };
      this.userData = {};
    }),
    PointLight: vi.fn(function PointLight(this: any) {
      this.position = { set: vi.fn(), x: 0, y: 0, z: 0 };
      this.intensity = 1;
    }),
    AmbientLight: vi.fn(), HemisphereLight: vi.fn(),
    Clock: vi.fn().mockImplementation(() => ({ getDelta: vi.fn().mockReturnValue(0.016) })),
    Vector3,
    Color,
    MathUtils: {
      lerp: (a: number, b: number, t: number) => a + (b - a) * t,
    },
    AdditiveBlending: 2,
    BackSide: 1,
    DoubleSide: 2,
    ACESFilmicToneMapping: 3,
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
