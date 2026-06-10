// src/lib/store.ts
import { create } from "zustand";
import type { User, Couple } from "@/types";

interface HumStore {
  me: User | null;
  partner: User | null;
  couple: Couple | null;
  setMe: (user: User | null) => void;
  setPartner: (user: User | null) => void;
  setCouple: (couple: Couple | null) => void;
  reset: () => void;
}

export const useHumStore = create<HumStore>((set) => ({
  me:      null,
  partner: null,
  couple:  null,
  setMe:      (me)      => set({ me }),
  setPartner: (partner) => set({ partner }),
  setCouple:  (couple)  => set({ couple }),
  reset: () => set({ me: null, partner: null, couple: null }),
}));
