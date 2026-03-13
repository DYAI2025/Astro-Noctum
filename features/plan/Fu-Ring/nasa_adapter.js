/**
 * @motion-ring/adapters - NASA Multi-Stream DONKI Adapter
 * Fetching 10 endpoints and implementing DDC Dynamics
 */

const ENDPOINTS = [
    { id: 'CME', label: 'CME', weight: 0.8 },
    { id: 'CMEAnalysis', label: 'CME Analysis', weight: 1.0 },
    { id: 'GST', label: 'Geomagnetic Storm', weight: 0.9 },
    { id: 'IPS', label: 'Interplanetary Shock', weight: 0.7 },
    { id: 'FLR', label: 'Solar Flare', weight: 1.2 },
    { id: 'SEP', label: 'Solar Energetic Particle', weight: 0.9 },
    { id: 'MPC', label: 'Magnetopause Crossing', weight: 0.6 },
    { id: 'RBE', label: 'Radiation Belt Enhancement', weight: 0.6 },
    { id: 'HSS', label: 'High Speed Stream', weight: 0.7 },
    { id: 'WSAEnlilSimulations', label: 'Enlil Simulation', weight: 1.1 }
];

export class NasaMultiStreamAdapter {
    constructor() {
        this.apiKey = '2oXwb85CAnYNWPGf8a1Ku4PX3JcITniCfsj3dSMB';
        this.signals = new Array(10).fill(0);
        this.streamStates = ENDPOINTS.map(e => ({ ...e, status: 'IDLE', val: 0 }));
        this.isPolling = false;
        this.onUpdate = null;
    }

    async poll() {
        if (!this.isPolling) return;

        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        const startDate = thirtyDaysAgo.toISOString().split('T')[0];

        const fetchPromises = ENDPOINTS.map(async (ep, idx) => {
            this.streamStates[idx].status = 'LOADING';
            try {
                const target = `https://api.nasa.gov/DONKI/${ep.id}?startDate=${startDate}&api_key=${this.apiKey}`;
                const proxyUrl = "https://dev-edge.flowith.net/api-proxy/" + encodeURIComponent(target);
                
                const response = await fetch(proxyUrl);
                if (!response.ok) throw new Error('API limit/error');
                const data = await response.json();
                

                let activity = Array.isArray(data) ? data.length : 0;
                let intensity = 0;
                if (ep.id === 'CMEAnalysis' && data.length > 0) {
                    intensity = Math.max(...data.map(d => d.speed || 0)) / 2000;
                }
                

                const rawSig = Math.tanh((activity * 0.2 + intensity) * ep.weight - 0.5);
                this.streamStates[idx].val = rawSig;
                this.streamStates[idx].status = 'SUCCESS';
                return rawSig;
            } catch (e) {

                this.streamStates[idx].status = 'MOCK';
                const mock = (Math.random() - 0.5) * 1.2;
                this.streamStates[idx].val = mock;
                return mock;
            }
        });

        const newSignals = await Promise.all(fetchPromises);
        this.applyDDCDynamics(newSignals);
        
        if (this.onUpdate) this.onUpdate(this.signals, this.streamStates);
        setTimeout(() => this.poll(), 15000); // 15s refresh
    }

    applyDDCDynamics(raw) {
        let processed = [...raw];
        

        for (let i = 0; i < 10; i++) {
            if (raw[i] > 0.5) {

                if (Math.random() < 0.3) {
                    processed[(i + 1) % 10] += raw[i] * 0.4;
                    processed[(i - 1 + 10) % 10] += raw[i] * 0.4;

                    if (Math.random() < 0.15) {
                        processed[(i + 2) % 10] += raw[i] * 0.2;
                        processed[(i - 2 + 10) % 10] += raw[i] * 0.2;

                        if (Math.random() < 0.075) {
                            processed[(i + 3) % 10] += raw[i] * 0.1;
                        }
                    }
                }
            }
        }


        this.signals = processed.map((val, i) => {
            const current = this.signals[i];
            const target = Math.max(-1, Math.min(1, val));
            return current + (target - current) * 0.1; // Smooth transition
        });
    }

    start(callback) {
        this.onUpdate = callback;
        this.isPolling = true;
        this.poll();
    }

    stop() { this.isPolling = false; }
}
