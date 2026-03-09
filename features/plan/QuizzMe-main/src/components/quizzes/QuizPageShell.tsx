import Link from 'next/link'
import React from 'react'

interface QuizPageShellProps {
    title: string
    children: React.ReactNode
}

export function QuizPageShell({ title, children }: QuizPageShellProps) {
    return (
        <div
            className="min-h-screen flex flex-col font-sans"
            style={{ background: 'var(--alchemy-cream)' }}
        >
            <header
                className="shadow-sm sticky top-0 z-10"
                style={{
                    background: 'var(--alchemy-cream-light)',
                    borderBottom: '1px solid rgba(210, 169, 90, 0.2)',
                }}
            >
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link
                        href="/verticals/quiz"
                        className="font-bold text-lg hover:opacity-80 transition-opacity"
                        style={{ color: 'var(--alchemy-gold-dark)' }}
                    >
                        ← All Quizzes
                    </Link>
                    <h1
                        className="text-xl font-semibold truncate ml-4"
                        style={{ fontFamily: 'var(--font-serif)', color: 'var(--alchemy-text-dark)' }}
                    >
                        {title}
                    </h1>
                    <div className="w-24"></div> {/* Spacer for balance */}
                </div>
            </header>

            <main className="flex-grow container mx-auto px-4 py-8 max-w-2xl">
                <div
                    className="rounded-2xl shadow-lg p-6 md:p-8"
                    style={{
                        background: 'var(--alchemy-cream-light)',
                        border: '1px solid var(--alchemy-gold-primary)',
                    }}
                >
                    {children}
                </div>
            </main>

            <footer
                className="text-center py-6 text-sm"
                style={{ color: 'var(--alchemy-text-dark-muted)' }}
            >
                <p>© 2024 Quiz Platform. For entertainment purposes only.</p>
            </footer>
        </div>
    )
}
