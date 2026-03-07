'use client'

import { LoveLanguagesQuiz } from '@/components/quizzes/LoveLanguagesQuiz'
import { QuizPageShell } from '@/components/quizzes/QuizPageShell'

export default function LoveLanguagesPage() {
    return (
        <QuizPageShell title="Die 5 Sprachen der Liebe">
            <LoveLanguagesQuiz />
        </QuizPageShell>
    )
}
