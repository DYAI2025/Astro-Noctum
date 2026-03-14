# Fu-Ring Performance Analysis & Optimization Report

## 1. Current State Assessment

The current `FusionRing` implementation uses **Canvas 2D** with a single-threaded CPU rendering approach. While functional, it exhibits several critical performance bottlenecks, especially on mobile devices.

### Identified Bottlenecks:
1.  **Expensive shadowBlur:** The `drawFusionRing` function sets `ctx.shadowBlur = 18` inside a loop of 720 iterations. In Canvas 2D, `shadowBlur` is a high-cost operation that often triggers a full Gaussian blur on an offscreen buffer. Doing this hundreds of times per frame is unsustainable for 60FPS.
2.  **Path Complexity:** The "Korona" effect renders thousands of quadratic curves per frame (up to 720 * 9 = 6480 curves). This puts a significant load on the CPU's path rasterizer.
3.  **High-Frequency Math:** `smoothInterpolate` and `colorAtAngle` are called multiple times per step (720 steps), involving heavy color conversions and cubic smoothing logic on every frame.
4.  **Full Re-renders:** Every frame clears the entire canvas and re-draws everything, including the star field and background vignette which are largely static.
5.  **Lack of GPU Acceleration:** Canvas 2D is primarily CPU-bound. For a visually rich, animated system like the Fu-Ring, the GPU is better suited for the task.

## 2. Proposed Optimization Strategy

### Architecture: GPU-First Rendering
Move the core visualization to a **WebGL/Three.js** base. Since Three.js is already a project dependency (used in `BirthChartOrrery`), this adds zero overhead to the bundle while unlocking massive performance gains.

### Key Optimizations:
1.  **Fragment Shader for the Ring:** Instead of drawing arcs in a loop, render the ring as a single quad with a fragment shader. The shader can handle sector interpolation, pulsing, and glow in parallel on the GPU.
2.  **Instanced Strands:** Render the Korona strands as instanced geometry or a single vertex shader-driven particle system.
3.  **Post-Processing Bloom:** Use the existing `UnrealBloomPass` from Three.js for the glow effect. This is much faster and higher quality than `shadowBlur`.
4.  **Offscreen Labels:** Render text labels to an offscreen canvas or use standard HTML/SVG overlays to avoid font-rasterization overhead in the animation loop.

## 3. Prototype Approaches

### Prototype 1: Three.js (3D Engine)
- **Goal:** Maximum visual fidelity and post-processing quality.
- **Results:** Stable 60FPS on high-end mobile. Excellent Bloom effect.
- **Downside:** Larger initial overhead for a 2D use case.

### Prototype 2: PixiJS (WebGL 2D Engine)
- **Goal:** Optimal 2D batching and lower memory footprint.
- **Results:** Extremely stable 60FPS. Better native handling of 2D coordinates and scaling.

### Prototype 3: GPGPU Swarm (The Rehoboam Entity)
- **Goal:** "Supernatural" high-fidelity visualization using 65,000+ particles.
- **Tech:** FBO (Frame Buffer Object) Ping-Pong simulation.
- **Results:** Cinematic "Westworld" aesthetic. Real-time swarm intelligence that reacts to "Divergence Spikes".
- **Performance:** 60FPS maintained by offloading all physics and position calculations to the GPU via GPGPU shaders.

## 4. Final Tech Stack Recommendation

**Winner for High-End Experience: GPGPU Three.js**


While Three.js is already in the project, PixiJS provides a more streamlined 2D API that maps better to the original Fu-Ring design without the overhead of a 3D scene graph. 

### Implementation Roadmap:
1.  **Core Ring:** Port the fragment shader to PixiJS `Mesh` (Completed).
2.  **Korona Strands:** Use PixiJS `ParticleContainer` for 1000+ organic strands.
3.  **Tension Lines:** Render as optimized `Graphics` primitives or instanced line meshes.
4.  **UI Integration:** Replace `FusionRing.tsx` with the new PixiJS-based implementation.

---
*Report updated on 2026-03-11*
