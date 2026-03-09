'use client'

import { PersonalityQuiz } from '@/components/quizzes/PersonalityQuiz'
import { QuizPageShell } from '@/components/quizzes/QuizPageShell'

export default function PersonalityQuizPage() {
    return (
        <QuizPageShell title="Selbstfürsorge Check">
            <PersonalityQuiz />
        </QuizPageShell>
    )
}
