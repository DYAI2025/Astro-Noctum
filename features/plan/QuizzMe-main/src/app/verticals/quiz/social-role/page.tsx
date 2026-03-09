'use client'

import { SocialRoleQuiz } from '@/components/quizzes/SocialRoleQuiz'
import { QuizPageShell } from '@/components/quizzes/QuizPageShell'

export default function SocialRoleQuizPage() {
    return (
        <QuizPageShell title="Wer bist du für andere?">
            <SocialRoleQuiz />
        </QuizPageShell>
    )
}
