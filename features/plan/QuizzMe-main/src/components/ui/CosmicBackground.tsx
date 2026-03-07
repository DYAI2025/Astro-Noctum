import React from 'react';

/**
 * CosmicBackground Component
 * 
 * Wraps the content in the "Glowing-Outlines" cosmic nebula background.
 * Uses the CSS class definitions from `styles/cosmic-nebula.css`.
 */
export function CosmicBackground({
    children,
    animated = false
}: {
    children: React.ReactNode;
    animated?: boolean;
}) {
    const bgClass = animated ? 'quiz-nebula-bg--animated' : 'quiz-nebula-bg';

    return (
        <>
            <div className={bgClass} aria-hidden="true" />
            <div className="relative z-10 min-h-screen">
                {children}
            </div>
        </>
    );
}
