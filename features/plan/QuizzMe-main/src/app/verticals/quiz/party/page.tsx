
import React from 'react';
import { PartyQuiz } from '@/components/quizzes/PartyQuiz';

export default function PartyQuizPage() {
    return (
        <main className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                <PartyQuiz />
            </div>
        </main>
    );
}
