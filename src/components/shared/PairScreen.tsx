// src/components/shared/PairScreen.tsx
"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { HUM_PALETTE } from "@/lib/constants";
import type { User } from "@/types";

interface Props {
  me: User;
  onPaired: () => void;
}

export default function PairScreen({ me, onPaired }: Props) {
  const [code, setCode]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  // Add this useEffect inside PairScreen component
useEffect(() => {
  const interval = setInterval(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("couple_id")
      .eq("id", user.id)
      .single();

    if (profile?.couple_id) {
      clearInterval(interval);
      onPaired();
    }
  }, 3000);

  return () => clearInterval(interval);
}, []);
  

  const handlePair = async () => {
    if (!code.trim()) return;
    setLoading(true); setError("");
    const res = await fetch("/api/pair", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invite_code: code.trim() }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }
    onPaired();
  };

  const copyCode = () => {
    navigator.clipboard.writeText(me.invite_code);
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: "100vh", padding: "0 32px",
      background: HUM_PALETTE.warm,
    }}>
      <div style={{ position: "fixed", top: -80, right: -80, width: 300, height: 300, borderRadius: "50%", background: HUM_PALETTE.peach, filter: "blur(60px)", opacity: 0.22, pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 380, textAlign: "center" }}>
        <div style={{ fontSize: 52 }}>🩷</div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: HUM_PALETTE.brown, margin: "12px 0 6px" }}>
          Pair with your person
        </div>
        <div style={{ fontSize: 13, color: HUM_PALETTE.muted, fontWeight: 600, marginBottom: 40 }}>
          Share your code with them, or enter theirs below
        </div>

        {/* My invite code */}
        <div style={{ background: "white", border: `1.5px solid ${HUM_PALETTE.blush}`, borderRadius: 20, padding: "20px 24px", marginBottom: 24, cursor: "pointer" }} onClick={copyCode}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: HUM_PALETTE.muted, textTransform: "uppercase", marginBottom: 6 }}>
            Your invite code
          </div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, color: HUM_PALETTE.terracotta, letterSpacing: 6 }}>
            {me.invite_code}
          </div>
          <div style={{ fontSize: 11, color: HUM_PALETTE.muted, fontWeight: 600, marginTop: 6 }}>
            Tap to copy 📋
          </div>
        </div>

        {/* Enter partner's code */}
        <div style={{ fontSize: 13, color: HUM_PALETTE.muted, fontWeight: 700, marginBottom: 10 }}>
          Enter their code
        </div>
        <input
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. AB12CD"
          maxLength={6}
          style={{
            width: "100%", padding: "16px 20px", borderRadius: 18,
            border: `1.5px solid ${HUM_PALETTE.blush}`,
            fontSize: 20, fontWeight: 700, letterSpacing: 4,
            background: "white", color: HUM_PALETTE.brown,
            outline: "none", fontFamily: "inherit",
            textAlign: "center", marginBottom: 12,
          }}
        />

        {error && <div style={{ color: HUM_PALETTE.deep, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{error}</div>}

        <button
          onClick={handlePair}
          disabled={loading || code.length < 6}
          style={{
            width: "100%", padding: "16px", borderRadius: 18,
            background: HUM_PALETTE.terracotta, color: "white",
            border: "none", fontSize: 15, fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 6px 20px rgba(212,120,90,0.3)",
            fontFamily: "inherit",
            opacity: (loading || code.length < 6) ? 0.6 : 1,
          }}
        >
          {loading ? "Connecting..." : "Connect 🩷"}
        </button>
      </div>
    </div>
  );
}
