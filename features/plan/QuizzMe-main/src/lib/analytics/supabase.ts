import { createClient } from "@/lib/supabase/client";

type QuizEvent = {
  event: string;
  quizId?: string;
  metadata?: Record<string, unknown>;
};

export async function trackQuizEvent({ event, quizId, metadata }: QuizEvent) {
  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const payload = {
      event,
      quiz_id: quizId,
      metadata,
      user_id: user?.id ?? null,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('quiz_analytics').insert(payload);
    if (error) {
      console.warn('Analytics insert failed', error.message);
    }
  } catch (err) {
    console.warn('Analytics tracking failed', err);
  }
}
