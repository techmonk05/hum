// src/lib/constants.ts
import type { PingConfig, PingType, UICopy } from "@/types";

export const HUM_PALETTE = {
  cream:      "#1A1014",
  peach:      "#3D2030",
  rose:       "#4A1B2E",
  blush:      "#2D1820",
  terracotta: "#D4785A",
  brown:      "#F5DDD0",
  warm:       "#120C10",
  orange:     "#FF8C5A",
  muted:      "#A67868",
  deep:       "#E8856A",
} as const;

// All UI copy in English. Only questions/prompts are in Hinglish.
export const UI_COPY: Record<"masculine" | "feminine", UICopy> = {
  masculine: {
    skipBtn:        "I'll answer later",
    partnerWaiting: (p) => `Waiting for ${p}'s answer... you'll get a notification 🩷`,
    thinkingOf:     "Thinking of you",
    missing:        "Missing you",
    amazing:        "You're amazing",
    hug:            "Sending a hug",
    cantSleep:      "Can't sleep",
    loveYou:        "Love you, that's it",
  },
  feminine: {
    skipBtn:        "I'll answer later",
    partnerWaiting: (p) => `Waiting for ${p}'s answer... you'll get a notification 🩷`,
    thinkingOf:     "Thinking of you",
    missing:        "Missing you",
    amazing:        "You're amazing",
    hug:            "Sending a hug",
    cantSleep:      "Can't sleep",
    loveYou:        "Love you, that's it",
  },
};

export const PING_CONFIG: PingConfig[] = [
  { type: "thinking_of_you", emoji: "💭", label: "Thinking of you" },
  { type: "missing_you",     emoji: "🥺", label: "Missing you" },
  { type: "youre_amazing",   emoji: "🔥", label: "You're amazing" },
  { type: "sending_hug",     emoji: "🤗", label: "Sending a hug" },
  { type: "cant_sleep",      emoji: "😴", label: "Can't sleep" },
  { type: "love_you",        emoji: "❤️", label: "Love you, that's it" },
];

// Hinglish prompts — gender-neutral constructions only
export const PROMPTS = {
  reflective: [
    "Aaj ka sabse achha moment kya tha apna? 🌸",
    "Ek cheez jo aaj mere baare mein feel hui? Honest rehna 🤍",
    "Agar hum abhi teleport kar sakte, kahan jaana chahoge? ✨",
    "Apni life ka ek aisa pal jo kabhi bhool nahi sakta/sakti? 🌙",
    "Kuch aisa jo tu mujhe kehna chahta/chahti hai, par keh nahi paya/payi? 💬",
    "Aaj ki teri sabse badi feeling — ek word mein bata? 🎨",
    "Ek cheez jo tune aaj notice ki jo normally ignore kar deta/deti? 🌿",
    "Agar main aaj tere paas hota/hoti, kya karte hum? ☕",
  ],
  playful: [
    "Humari last date ko 10 mein se rate kar — aur justify bhi karo! 🔥",
    "Ek aisi embarrassing story jo tune abhi tak nahi batai? 😂",
    "Agar main Bollywood character hota/hoti, kaun hota/hoti main? 💀",
    "Humara ek couple song fix karo — no basic choices! 🎵",
    "Road trip pe hum jaate toh — tu drive karega/karegi ya navigate? 🚗",
    "Meri 3 annoying habits honestly bata — no mercy! 😭",
    "Aaj ka mood kaunse food item jaisa hai? Explain karo 🍕",
    "Humara couple name kya hona chahiye? Creative answer only 🦋",
  ],
};

// Kaun Zyada categories + questions — full chaos, culturally on point
export const KZ_CATEGORIES: Record<string, string[]> = {
  "Desi life & family 🏠": [
    "Ghar pe jhooth bolne mein",
    "Mummy ko manane mein",
    "Relatives ke sawalon se bachne mein",
    "Ghar ki safai avoid karne mein",
    "Bade se seedha baat karne mein",
    "Bina permission ghumne mein",
  ],
  "Bollywood & pop culture 🎬": [
    "SRK ka fan hone mein",
    "Ek hi gaana repeat karne mein",
    "Movie mein rone mein",
    "Dialogue yaad rakhne mein",
    "Trailer dekh ke spoiler dene mein",
    "Reel banane ka plan banana mein",
  ],
  "Relationship & romance 💕": [
    "Pehle sorry bolne mein",
    "Overshare karne mein",
    "Cute nicknames banana mein",
    "Date plan karne mein",
    "Zyada clingy hone mein",
    "Choti baat pe serious hone mein",
  ],
  "Unhinged & funny 😂": [
    "2am mein nonsense bolne mein",
    "Kuch bhi order karne mein aur regret karne mein",
    "Khud se baat karne mein",
    "Sone ka plan banake raat bhar jaagne mein",
    "Ek chhoti si baat ko dramatic banana mein",
    "Random conspiracy theories believe karne mein",
  ],
  "Career & ambition 💼": [
    "Last minute kaam karne mein",
    "LinkedIn pe impressive dikhne mein",
    "Apna idea sabko explain karne mein",
    "Kaam se pehle chai banana mein",
    "Deadlines miss karne mein",
    "Khud ko overestimate karne mein",
  ],
  "Food & cravings 🍛": [
    "Raat ko kuch bhi khaane mein",
    "Dusre ki plate se khaane mein",
    "Menu mein sabse mehnga item order karne mein",
    "Spicy khake pachtaane mein",
    "Aadha khaake chhod dene mein",
    "Khaana order karne ke baad cancel karne mein",
  ],
};
