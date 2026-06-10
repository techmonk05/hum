// src/app/(auth)/login/page.tsx
"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HUM_PALETTE } from "@/lib/constants";

export default function LoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push("/home");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "0 32px", background: HUM_PALETTE.warm }}>

      {/* Blobs */}
      <div style={{ position: "fixed", top: -80, right: -80, width: 300, height: 300, borderRadius: "50%", background: HUM_PALETTE.peach, filter: "blur(60px)", opacity: 0.22, pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: 100, left: -60, width: 250, height: 250, borderRadius: "50%", background: HUM_PALETTE.rose, filter: "blur(60px)", opacity: 0.22, pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 380 }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 52, color: HUM_PALETTE.terracotta, textAlign: "center", letterSpacing: -1 }}>
          H<span style={{ fontStyle: "italic", color: HUM_PALETTE.deep }}>um</span>
        </div>
        <div style={{ textAlign: "center", fontSize: 13, color: HUM_PALETTE.muted, fontWeight: 600, marginBottom: 48 }}>
          just us 🩷
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{
              padding: "16px 20px", borderRadius: 18,
              border: `1.5px solid ${HUM_PALETTE.blush}`,
              fontSize: 15, background: "white",
              color: HUM_PALETTE.brown, outline: "none",
              fontFamily: "inherit",
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{
              padding: "16px 20px", borderRadius: 18,
              border: `1.5px solid ${HUM_PALETTE.blush}`,
              fontSize: 15, background: "white",
              color: HUM_PALETTE.brown, outline: "none",
              fontFamily: "inherit",
            }}
          />

          {error && <div style={{ color: HUM_PALETTE.deep, fontSize: 13, fontWeight: 600 }}>{error}</div>}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              padding: "16px", borderRadius: 18,
              background: HUM_PALETTE.terracotta,
              color: "white", border: "none",
              fontSize: 15, fontWeight: 700,
              cursor: "pointer", marginTop: 4,
              boxShadow: "0 6px 20px rgba(212,120,90,0.3)",
              fontFamily: "inherit",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Logging in..." : "Log in 🩷"}
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: HUM_PALETTE.muted, fontWeight: 600 }}>
          Don't have an account?{" "}
          <Link href="/signup" style={{ color: HUM_PALETTE.terracotta, fontWeight: 700, textDecoration: "none" }}>
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
