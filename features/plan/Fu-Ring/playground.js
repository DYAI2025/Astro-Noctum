import { createMotionRing } from './motion_ring_core.js';
import { NasaMultiStreamAdapter } from './nasa_adapter.js';

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    const canvas = document.getElementById('motion-ring-canvas');
    const ring = createMotionRing(canvas, { radius: 180, pointCount: 240, sensitivity: 1.0 });
    const nasa = new NasaMultiStreamAdapter();
    
    let currentMode = 'manual';

    ring.start();

    const ui = {
        btnToggle: document.getElementById('btn-toggle'),
        btnPulse: document.getElementById('btn-pulse'),
        btnReset: document.getElementById('btn-reset'),
        btnModeManual: document.getElementById('mode-manual'),
        btnModeNasa: document.getElementById('mode-nasa'),
        btnDebug: document.getElementById('btn-show-debug'),
        streamList: document.getElementById('stream-status-list'),
        monitor: document.getElementById('nasa-monitor'),
        nasaFeed: document.getElementById('nasa-feed'),
        manualSect: document.getElementById('manual-controls'),
        nasaSect: document.getElementById('nasa-controls'),
        ctrlSignal: document.getElementById('ctrl-signal'),
        valSignal: document.getElementById('val-signal'),
        ctrlRadius: document.getElementById('ctrl-radius'),
        valRadius: document.getElementById('val-radius'),
        ctrlPoints: document.getElementById('ctrl-points'),
        valPoints: document.getElementById('val-points'),
        ctrlSensitivity: document.getElementById('ctrl-sensitivity'),
        valSensitivity: document.getElementById('val-sensitivity')
    };

    function updateNasaUI(signals, states) {
        ui.streamList.innerHTML = states.map(s => `
            <div class="flex justify-between items-center gap-4">
                <span>${s.label}</span>
                <span class="${s.status === 'SUCCESS' ? 'text-green-600' : 'text-orange-500'}">[${s.status}]</span>
            </div>
        `).join('');

        ui.monitor.innerHTML = states.map((s, i) => `
            <div class="p-2 bg-zinc-50 border border-black/5 flex flex-col gap-1">
                <div class="flex justify-between text-[9px] font-bold">
                    <span>${s.id}</span>
                    <span>${signals[i].toFixed(2)}</span>
                </div>
                <div class="h-1 bg-zinc-200 overflow-hidden">
                    <div class="h-full bg-black transition-all duration-500" style="width: ${Math.abs(signals[i]) * 100}%; margin-left: ${signals[i] < 0 ? 'auto' : '0'}"></div>
                </div>
            </div>
        `).join('');
    }

    function switchMode(mode) {
        currentMode = mode;
        if (mode === 'nasa') {
            ui.btnModeNasa.classList.add('bg-white', 'shadow-sm', 'ring-1', 'ring-black/5');
            ui.btnModeManual.classList.add('opacity-40');
            ui.btnModeManual.classList.remove('bg-white', 'shadow-sm', 'ring-1', 'ring-black/5');
            ui.manualSect.classList.add('hidden');
            ui.nasaSect.classList.remove('hidden');
            ui.nasaFeed.style.opacity = '1';
            nasa.start((sigs, states) => {
                ring.setSignals(sigs);
                updateNasaUI(sigs, states);
            });
        } else {
            ui.btnModeManual.classList.add('bg-white', 'shadow-sm', 'ring-1', 'ring-black/5');
            ui.btnModeNasa.classList.add('opacity-40');
            ui.btnModeNasa.classList.remove('bg-white', 'shadow-sm', 'ring-1', 'ring-black/5');
            ui.nasaSect.classList.add('hidden');
            ui.manualSect.classList.remove('hidden');
            ui.nasaFeed.style.opacity = '0';
            nasa.stop();
            ring.setSignals(parseFloat(ui.ctrlSignal.value));
        }
    }

    ui.btnModeManual.addEventListener('click', () => switchMode('manual'));
    ui.btnModeNasa.addEventListener('click', () => switchMode('nasa'));
    
    ui.btnDebug.addEventListener('click', () => {
        ring.config.debug = !ring.config.debug;
        ui.btnDebug.classList.toggle('bg-black');
        ui.btnDebug.classList.toggle('text-white');
    });

    ui.ctrlSignal.addEventListener('input', (e) => {
        const v = parseFloat(e.target.value);
        ui.valSignal.textContent = v.toFixed(2);
        if (currentMode === 'manual') ring.setSignals(v);
    });

    ui.ctrlSensitivity.addEventListener('input', (e) => {
        const v = parseFloat(e.target.value);
        ui.valSensitivity.textContent = v.toFixed(1);
        ring.updateConfig({ sensitivity: v });
    });

    ui.ctrlRadius.addEventListener('input', (e) => {
        const v = parseInt(e.target.value);
        ui.valRadius.textContent = v;
        ring.updateConfig({ radius: v });
    });

    ui.ctrlPoints.addEventListener('input', (e) => {
        const v = parseInt(e.target.value);
        ui.valPoints.textContent = v;
        ring.updateConfig({ pointCount: v });
    });

    ui.btnToggle.addEventListener('click', () => {
        if (ring.state.running) {
            ring.stop();
            ui.btnToggle.textContent = 'Start Engine';
        } else {
            ring.start();
            ui.btnToggle.textContent = 'Stop Engine';
        }
    });

    ui.btnReset.addEventListener('click', () => {
        ring.generatePoints();
    });

    ui.btnPulse.addEventListener('click', () => {
        const originalRadius = ring.config.radius;
        gsap.to(ring.config, {
            radius: originalRadius * 1.3,
            duration: 0.1,
            yoyo: true,
            repeat: 1,
            onUpdate: () => {
                ui.valRadius.textContent = Math.round(ring.config.radius);
                ui.ctrlRadius.value = ring.config.radius;
            }
        });
    });


    const fpsEl = document.getElementById('status-fps');
    const ptsEl = document.getElementById('status-points');
    let lastTime = performance.now();
    function track() {
        const now = performance.now();
        const fps = Math.round(1000 / (now - lastTime));
        fpsEl.textContent = `FPS: ${fps}`;
        ptsEl.textContent = `Points: ${ring.state.points.length}`;
        lastTime = now;
        requestAnimationFrame(track);
    }
    track();
});
