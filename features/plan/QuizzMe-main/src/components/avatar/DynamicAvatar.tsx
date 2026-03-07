
'use client'

import React, { useMemo } from 'react';
import { AvatarParams } from '../../lib/lme/avatar-mapper';

interface DynamicAvatarProps {
    params: AvatarParams;
    className?: string;
    size?: number;
}

export function DynamicAvatar({ params, className = '', size = 300 }: DynamicAvatarProps) {
    // Generate shapes based on params
    // To keep it performant and SSR-friendly, we use SVG with deterministic randoms based on seed

    const shapes = useMemo(() => {
        const shapeCount = 3 + Math.floor(params.complexity * 5); // 3 to 8 shapes
        const generated = [];

        // Psuedo-random generator
        let seedState = params.seed * 12345;
        const random = () => {
            const x = Math.sin(seedState++) * 10000;
            return x - Math.floor(x);
        };

        for (let i = 0; i < shapeCount; i++) {
            const isSpiky = random() < params.spikiness;
            const radius = 30 + random() * 40;
            const x = 50 + (random() - 0.5) * (100 - params.symmetry * 80); // Higher symmetry = closer to center
            const y = 50 + (random() - 0.5) * (100 - params.symmetry * 80);

            // Color variation
            const hue = i % 2 === 0 ? params.baseHue : params.secondaryHue;
            const color = `hsla(${hue}, ${60 + random() * 20}%, ${50 + random() * 20}%, ${0.3 + random() * 0.4})`;

            generated.push({
                id: i,
                cx: x,
                cy: y,
                r: radius,
                color,
                rotationDuration: 10 / (params.rotationSpeed * (random() + 0.5)),
                isSpiky
            });
        }
        return generated;
    }, [params]);

    return (
        <div className={`relative rounded-full overflow-hidden bg-slate-900 ${className}`} style={{ width: size, height: size }}>
            {/* Background Glow */}
            <div
                className="absolute inset-0 opacity-50 blur-3xl"
                style={{
                    background: `radial-gradient(circle at center, hsla(${params.baseHue}, 70%, 40%, 0.6), transparent 70%)`
                }}
            />

            <svg
                viewBox="0 0 100 100"
                className="w-full h-full relative z-10"
                style={{ filter: `blur(${params.glowIntensity * 20}px) contrast(1.2)` }}
            >
                <defs>
                    <filter id="noise">
                        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
                        <feColorMatrix type="saturate" values="0" />
                    </filter>
                </defs>

                {shapes.map((shape) => (
                    <React.Fragment key={shape.id}>
                        <style dangerouslySetInnerHTML={{
                            __html: `
                    @keyframes spin-${shape.id} {
                        from { transform: rotate(0deg); transform-origin: ${shape.cx}px ${shape.cy}px; }
                        to { transform: rotate(360deg); transform-origin: ${shape.cx}px ${shape.cy}px; }
                    }
                 `}} />

                        {shape.isSpiky ? (
                            <polygon
                                points={`${shape.cx},${shape.cy - shape.r} ${shape.cx + shape.r},${shape.cy} ${shape.cx},${shape.cy + shape.r} ${shape.cx - shape.r},${shape.cy}`}
                                fill={shape.color}
                                style={{ animation: `spin-${shape.id} ${shape.rotationDuration}s linear infinite` }}
                            />
                        ) : (
                            <circle
                                cx={shape.cx}
                                cy={shape.cy}
                                r={shape.r}
                                fill={shape.color}
                                style={{ animation: `spin-${shape.id} ${shape.rotationDuration}s linear infinite` }}
                            />
                        )}
                    </React.Fragment>
                ))}

                {/* Noise Overlay */}
                <rect width="100%" height="100%" filter="url(#noise)" opacity={params.noiseOpacity} fill="transparent" />
            </svg>

            {/* Central Core */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/6 h-1/6 bg-white rounded-full blur-xl opacity-80 mix-blend-overlay"></div>
        </div>
    );
}
