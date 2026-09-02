import 'server-only';

import type { ViolationCategory } from '@/types/database';

export type BundledTerm = {
  term: string;
  category: ViolationCategory;
  severity: number;
};

/**
 * Server-only default rules. Keep insults out of UI components.
 * Admin custom terms from the database are merged at runtime.
 */
export const bundledBlockedTerms: BundledTerm[] = [
  { term: 'كسم', category: 'insult_ar', severity: 5 },
  { term: 'كسامك', category: 'insult_ar', severity: 5 },
  { term: 'شرموط', category: 'insult_ar', severity: 5 },
  { term: 'عرص', category: 'insult_ar', severity: 5 },
  { term: 'خول', category: 'insult_ar', severity: 4 },
  { term: 'قحبه', category: 'insult_ar', severity: 5 },
  { term: 'قحبة', category: 'insult_ar', severity: 5 },
  { term: 'متناك', category: 'insult_ar', severity: 5 },
  { term: 'منيوك', category: 'insult_ar', severity: 5 },
  { term: 'ابنالكلب', category: 'insult_ar', severity: 4 },
  { term: 'ياكلب', category: 'personal_attack', severity: 3 },
  { term: 'ياحقير', category: 'personal_attack', severity: 3 },
  { term: 'يلعن', category: 'personal_attack', severity: 3 },
  { term: 'fuck', category: 'insult_en', severity: 4 },
  { term: 'fck', category: 'insult_en', severity: 4 },
  { term: 'shit', category: 'insult_en', severity: 3 },
  { term: 'bitch', category: 'insult_en', severity: 4 },
  { term: 'asshole', category: 'insult_en', severity: 4 },
  { term: 'slut', category: 'insult_en', severity: 5 },
  { term: 'whore', category: 'insult_en', severity: 5 },
  { term: 'cunt', category: 'insult_en', severity: 5 },
  { term: 'retard', category: 'hate_speech', severity: 4 },
  { term: 'nigger', category: 'hate_speech', severity: 5 },
  { term: 'faggot', category: 'hate_speech', severity: 5 },
  { term: 'kosom', category: 'insult_arabizi', severity: 5 },
  { term: 'ksmk', category: 'insult_arabizi', severity: 5 },
  { term: 'sharmota', category: 'insult_arabizi', severity: 5 },
  { term: '3ars', category: 'insult_arabizi', severity: 5 },
  { term: 'khawal', category: 'insult_arabizi', severity: 4 },
  { term: 'sendnudes', category: 'sexual_harassment', severity: 5 },
  { term: 'ابعتيصور', category: 'sexual_harassment', severity: 5 },
  { term: 'ابعتيصور', category: 'sexual_harassment', severity: 5 },
  { term: 'nudepic', category: 'sexual_harassment', severity: 5 },
  { term: 'هقتلك', category: 'threat', severity: 5 },
  { term: 'هاقتلك', category: 'threat', severity: 5 },
  { term: 'iwillkill', category: 'threat', severity: 5 },
  { term: 'killmyself', category: 'threat', severity: 4 },
  { term: 'كillingyou', category: 'threat', severity: 5 },
];
