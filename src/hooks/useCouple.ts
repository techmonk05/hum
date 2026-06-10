// src/hooks/useCouple.ts
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User, Couple } from "@/types";

interface UseCoupleReturn {
  me: User | null;
  partner: User | null;
  couple: Couple | null;
  loading: boolean;
  isPaired: boolean;
}

export function useCouple(): UseCoupleReturn {
  const [me, setMe]           = useState<User | null>(null);
  const [partner, setPartner] = useState<User | null>(null);
  const [couple, setCouple]   = useState<Couple | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { router.push("/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (!profile) { router.push("/login"); return; }
      setMe(profile);

      if (profile.couple_id) {
        const { data: coupleData } = await supabase
          .from("couples")
          .select("*")
          .eq("id", profile.couple_id)
          .single();
        setCouple(coupleData);

        if (coupleData) {
          const partnerId = coupleData.user1_id === authUser.id
            ? coupleData.user2_id
            : coupleData.user1_id;

          const { data: partnerProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", partnerId)
            .single();
          setPartner(partnerProfile);
        }
      }

      setLoading(false);
    };

    load();
  }, []);

  return { me, partner, couple, loading, isPaired: !!couple };
}