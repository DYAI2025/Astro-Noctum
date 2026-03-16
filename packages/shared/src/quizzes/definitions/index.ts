import type { QuizDefinition } from '../schema';

import { personalityQuiz } from './personality';
import { careerDnaQuiz } from './career-dna';
import { auraColorsQuiz } from './aura-colors';
import { krafttierQuiz } from './krafttier';
import { destinyQuiz } from './destiny';
import { charmeQuiz } from './charme';
import { eqQuiz } from './eq';
import { spotlightQuiz } from './spotlight';
import { socialRoleQuiz } from './social-role';
import { blumenwesenQuiz } from './blumenwesen';
import { energiesteinQuiz } from './energiestein';
import { celebritySoulmateQuiz } from './celebrity-soulmate';
import { partyQuiz } from './party';
import { rpgIdentityQuiz } from './rpg-identity';
import { loveLanguagesQuiz } from './love-languages';
import { kinky01Quiz } from './kinky-01';
import { kinky02Quiz } from './kinky-02';
import { kinky03Quiz } from './kinky-03';
import { kinky04Quiz } from './kinky-04';
import { partnerMatch01Quiz } from './partner-match-01';
import { partnerMatch02Quiz } from './partner-match-02';
import { partnerMatch03Quiz } from './partner-match-03';
import { conversationAnalysisQuiz } from './conversation-analysis';

/** All 22 playable quiz definitions + 1 AI-driven analysis (23 total) */
export const QUIZ_DEFINITIONS: QuizDefinition[] = [
  // Standalone quizzes
  personalityQuiz,
  careerDnaQuiz,
  auraColorsQuiz,
  krafttierQuiz,
  destinyQuiz,
  charmeQuiz,
  eqQuiz,
  spotlightQuiz,
  socialRoleQuiz,
  blumenwesenQuiz,
  energiesteinQuiz,
  celebritySoulmateQuiz,
  partyQuiz,
  rpgIdentityQuiz,
  loveLanguagesQuiz,
  // Kinky series (premium)
  kinky01Quiz,
  kinky02Quiz,
  kinky03Quiz,
  kinky04Quiz,
  // PartnerMatch series
  partnerMatch01Quiz,
  partnerMatch02Quiz,
  partnerMatch03Quiz,
  conversationAnalysisQuiz,
];

export {
  personalityQuiz, careerDnaQuiz, auraColorsQuiz, krafttierQuiz, destinyQuiz,
  charmeQuiz, eqQuiz, spotlightQuiz, socialRoleQuiz, blumenwesenQuiz,
  energiesteinQuiz, celebritySoulmateQuiz, partyQuiz, rpgIdentityQuiz, loveLanguagesQuiz,
  kinky01Quiz, kinky02Quiz, kinky03Quiz, kinky04Quiz,
  partnerMatch01Quiz, partnerMatch02Quiz, partnerMatch03Quiz, conversationAnalysisQuiz,
};
