'use client'

import { CelebritySoulmateQuiz } from '@/components/quizzes/CelebritySoulmateQuiz'
import { QuizPageShell } from '@/components/quizzes/QuizPageShell'

export default function CelebritySoulmatePage() {
    return (
        <QuizPageShell title="Celebrity Soulmate Quiz">
            <CelebritySoulmateQuiz />
        </QuizPageShell>
    )
}
