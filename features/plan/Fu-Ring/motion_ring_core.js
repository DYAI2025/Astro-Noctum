/**
 * @motion-ring/core
 * Refined Monochrome Motion Layer
 * Physics: Radial Baseline Deviation + Cascading Staggered Gravity
 */

export class MotionRing {
    constructor(canvas, config = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: true });
        this.dpr = window.devicePixelRatio || 1;
        
        this.config = {
            radius: config.radius || 180,
            pointCount: config.pointCount || 240,
            omega: config.omega || 0.005,
            sensitivity: config.sensitivity || 1.0,
            debug: false,
            styles: {
                baseColor: '#000000',
                lineWidth: 0.5,
                ...config.styles
            },
            physics: {
                neighborPull: 0.35,
                smoothing: 0.12,
                baseGravityChance: 0.03, 
                cascadeGravityChance: 0.015,
                gravityInterval: 10000, // 10s cascade trigger
                ...config.physics
            }
        };

        this.state = {
            running: false,
            points: [],
            sectorSignals: new Array(10).fill(0),
            currentSectorSignals: new Array(10).fill(0),
            time: 0,
            lastGlobalGravityTick: 0,
            sectorGravityTicks: new Array(10).fill(0).map(() => Math.random() * 5000),
            perfDegraded: false
        };

        this.init();
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    init() {
        this.generatePoints();
    }

    generatePoints() {
        const count = this.state.perfDegraded ? Math.min(this.config.pointCount, 120) : this.config.pointCount;
        this.state.points = Array.from({ length: count }, (_, i) => ({
            index: i,
            baseAngle: (i / count) * Math.PI * 2,
            currentAngle: (i / count) * Math.PI * 2,
            dr: 0,
            drCoupled: 0,
            noise: 0,
            gravityActive: false,
            gravityTimer: 0,
            angleOffset: 0
        }));
    }

    resize() {
        const parent = this.canvas.parentElement;
        const rect = parent.getBoundingClientRect();
        this.canvas.width = rect.width * this.dpr;
        this.canvas.height = rect.height * this.dpr;
        this.canvas.style.width = `${rect.width}px`;
        this.canvas.style.height = `${rect.height}px`;
        this.ctx.resetTransform();
        this.ctx.scale(this.dpr, this.dpr);
    }

    setSignals(signals) {
        if (Array.isArray(signals)) {
            this.state.sectorSignals = signals;
        } else {
            this.state.sectorSignals = new Array(10).fill(signals);
        }
    }

    getRandomGravityDuration() {
        const min = 1000;
        const max = 20000;
        return min + Math.random() * (max - min);
    }

    update() {
        if (!this.state.running) return;

        const now = performance.now();
        const { physics, radius, sensitivity } = this.config;
        const points = this.state.points;
        const count = points.length;


        for (let s = 0; s < 10; s++) {
            if (now - this.state.sectorGravityTicks[s] > physics.gravityInterval) {
                this.state.sectorGravityTicks[s] = now + (Math.random() * 1000); // Slight offset
                

                points.forEach(p => {
                    const angleNorm = (p.baseAngle / (Math.PI * 2)) % 1;
                    const pSector = Math.floor(angleNorm * 10);
                    if (pSector === s && !p.gravityActive) {

                        const chance = physics.baseGravityChance * sensitivity;
                        if (Math.random() < chance) {
                            this.triggerGravity(p, now);
                        }
                    }
                });
            }
        }


        for (let s = 0; s < 10; s++) {
            this.state.currentSectorSignals[s] += (this.state.sectorSignals[s] - this.state.currentSectorSignals[s]) * physics.smoothing;
        }

        for (let i = 0; i < count; i++) {
            const p = points[i];
            const angleNorm = (p.baseAngle / (Math.PI * 2)) % 1;
            const sectorIdx = Math.floor(angleNorm * 10);
            

            const rawSig = this.state.currentSectorSignals[sectorIdx];
            const sig = Math.max(-1, Math.min(1, rawSig * sensitivity));



            const targetDr = sig >= 0 
                ? sig * (radius * 0.40) 
                : sig * (radius * 0.20);

            p.noise = (Math.random() - 0.5) * (1 + Math.abs(sig) * 8);
            p.dr += (targetDr - p.dr) * 0.1;


            const prev = points[(i - 1 + count) % count];
            const next = points[(i + 1) % count];
            const neighborAvg = (prev.drCoupled + next.drCoupled) / 2;
            p.drCoupled += (neighborAvg - p.drCoupled) * physics.neighborPull;
            

            if (p.gravityActive) {

                if (Math.random() < physics.cascadeGravityChance * sensitivity) {
                    if (!prev.gravityActive) this.triggerGravity(prev, now);
                    if (!next.gravityActive) this.triggerGravity(next, now);
                }
            }


            let targetAngleOffset = 0;
            const searchWindow = Math.floor(count * 0.08);
            for (let j = -searchWindow; j <= searchWindow; j++) {
                if (j === 0) continue;
                const other = points[(i + j + count) % count];
                if (other.gravityActive) {
                    const dist = Math.abs(j);
                    const strength = (1 - dist / searchWindow) * 0.04 * sensitivity;
                    targetAngleOffset += (j > 0 ? strength : -strength);
                }
            }

            p.angleOffset += (targetAngleOffset - p.angleOffset) * 0.05;
            p.currentAngle = p.baseAngle + p.angleOffset;


            if (p.gravityActive && now > p.gravityTimer) {
                p.gravityActive = false;
            }
        }
    }

    triggerGravity(point, now) {
        point.gravityActive = true;
        point.gravityTimer = now + this.getRandomGravityDuration();
    }

    draw() {
        const { ctx, canvas } = this;
        const { radius, styles, debug } = this.config;
        const w = canvas.width / this.dpr;
        const h = canvas.height / this.dpr;
        const cx = w / 2;
        const cy = h / 2;

        ctx.clearRect(0, 0, w, h);
        if (debug) this.drawDebugSectors(cx, cy);

        this.drawSmoke(cx, cy);


        ctx.beginPath();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = styles.lineWidth;
        ctx.globalAlpha = 0.25;

        for (let i = 0; i <= this.state.points.length; i++) {
            const p = this.state.points[i % this.state.points.length];
            const r = radius + p.dr + p.drCoupled;
            const x = cx + Math.cos(p.currentAngle) * r;
            const y = cy + Math.sin(p.currentAngle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();


        ctx.globalAlpha = 0.8;
        ctx.fillStyle = '#000000';
        for (const p of this.state.points) {
            const r = radius + p.dr + p.drCoupled + p.noise;
            const x = cx + Math.cos(p.currentAngle) * r;
            const y = cy + Math.sin(p.currentAngle) * r;
            ctx.fillRect(x - 0.5, y - 0.5, 1, 1);
            
            if (debug && p.gravityActive) {
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.stroke();
            }
        }


        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.72, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
    }

    drawSmoke(cx, cy) {
        const { ctx } = this;
        const { radius, sensitivity } = this.config;
        const passes = this.state.perfDegraded ? 6 : 14;
        
        ctx.save();
        const avgSig = (this.state.currentSectorSignals.reduce((a, b) => a + Math.abs(b), 0) / 10) * sensitivity;
        
        for (let i = 0; i < passes; i++) {
            ctx.globalAlpha = (0.012 + (avgSig * 0.04)) / (passes / 4);
            ctx.beginPath();
            const jitter = radius + (avgSig * radius * 0.35) + (Math.random() * 30 * avgSig);
            ctx.arc(cx, cy, jitter, 0, Math.PI * 2);
            ctx.lineWidth = 0.5 + Math.random() * 15;
            ctx.stroke();
        }
        ctx.restore();
    }

    drawDebugSectors(cx, cy) {
        const { ctx } = this;
        ctx.save();
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 10; i++) {
            const startAngle = (i / 10) * Math.PI * 2;
            const endAngle = ((i + 1) / 10) * Math.PI * 2;
            ctx.strokeStyle = `rgba(0,0,0,0.08)`;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, 400, startAngle, endAngle);
            ctx.stroke();
        }
        ctx.restore();
    }

    start() {
        if (this.state.running) return;
        this.state.running = true;
        const loop = () => {
            this.update();
            this.draw();
            if (this.state.running) requestAnimationFrame(loop);
        };
        loop();
    }

    stop() { this.state.running = false; }
    updateConfig(p) { this.config = { ...this.config, ...p }; if(p.pointCount) this.generatePoints(); }
}

export function createMotionRing(canvas, config) {
    return new MotionRing(canvas, config);
}
