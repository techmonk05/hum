// src/types/index.ts

export type Gender = "masculine" | "feminine";

export interface User {
  id: string;
  name: string;
  email: string;
  gender: Gender;
  avatar_url: string | null;
  couple_id: string | null;
  invite_code: string;
  created_at: string;
}

export interface Couple {
  id: string;
  user1_id: string;
  user2_id: string;
  streak: number;
  last_active: string;
  anniversary: string | null;
  created_at: string;
}

export interface DailyPrompt {
  id: string;
  couple_id: string;
  prompt_text: string;
  prompt_mode: "reflective" | "playful";
  date: string; // YYYY-MM-DD
  created_at: string;
}

export interface PromptAnswer {
  id: string;
  prompt_id: string;
  user_id: string;
  answer_text: string;
  created_at: string;
}

export interface Ping {
  id: string;
  from_user_id: string;
  to_user_id: string;
  type: PingType;
  seen: boolean;
  created_at: string;
}

export type PingType =
  | "thinking_of_you"
  | "missing_you"
  | "youre_amazing"
  | "sending_hug"
  | "cant_sleep"
  | "love_you";

export interface KaunZyadaVote {
  id: string;
  couple_id: string;
  question: string;
  category: string;
  voted_for: string; // user_id
  voted_by: string;  // user_id
  date: string;
  created_at: string;
}

export interface PingConfig {
  type: PingType;
  emoji: string;
  label: string;
}

// Copy for gender-aware UI
export interface UICopy {
  skipBtn: string;
  partnerWaiting: (partner: string) => string;
  thinkingOf: string;
  missing: string;
  amazing: string;
  hug: string;
  cantSleep: string;
  loveYou: string;
}
