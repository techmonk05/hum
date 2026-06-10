// src/app/(auth)/signup/page.tsx
"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HUM_PALETTE } from "@/lib/constants";

export default function SignupPage() {
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender]     = useState<"masculine" | "feminine" | "">("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const router = useRouter();

  const handleSignup = async () => {
    if (!gender) { setError("Please select your gender for personalised copy"); return; }
    setLoading(true); setError("");
    const supabase = createClient();

    const { data, error: authErr } = await supabase.auth.signUp({ email, password });
    if (authErr || !data.user) { setError(authErr?.message ?? "Signup failed"); setLoading(false); return; }

    const { error: profileErr } = await supabase.from("profiles").insert({ id: data.user.id, name, gender });
    if (profileErr) { setError(profileErr.message); setLoading(false); return; }

    router.push("/home");
  };

  const inputStyle = {
    padding: "16px 20px", borderRadius: 18,
    border: `1.5px solid ${HUM_PALETTE.blush}`,
    fontSize: 15, background: "white",
    color: HUM_PALETTE.brown, outline: "none",
    fontFamily: "inherit", width: "100%",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "32px 32px", background: HUM_PALETTE.warm }}>
      <div style={{ position: "fixed", top: -80, right: -80, width: 300, height: 300, borderRadius: "50%", background: HUM_PALETTE.peach, filter: "blur(60px)", opacity: 0.22, pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: 100, left: -60, width: 250, height: 250, borderRadius: "50%", background: HUM_PALETTE.rose, filter: "blur(60px)", opacity: 0.22, pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 380 }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 40, color: HUM_PALETTE.terracotta, textAlign: "center", marginBottom: 4 }}>
          Join <span style={{ fontStyle: "italic", color: HUM_PALETTE.deep }}>Hum</span>
        </div>
        <div style={{ textAlign: "center", fontSize: 13, color: HUM_PALETTE.muted, fontWeight: 600, marginBottom: 32 }}>
          Create your account 🩷
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input placeholder="Your name" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} />

          {/* Gender selector — used for Hinglish grammar (masculine/feminine verb forms) */}
          <div style={{ display: "flex", gap: 10 }}>
            {(["masculine", "feminine"] as const).map(g => (
              <button
                key={g}
                onClick={() => setGender(g)}
                style={{
                  flex: 1, padding: "14px 10px", borderRadius: 16,
                  border: `1.5px solid ${gender === g ? HUM_PALETTE.terracotta : HUM_PALETTE.blush}`,
                  background: gender === g ? HUM_PALETTE.terracotta : "white",
                  color: gender === g ? "white" : HUM_PALETTE.muted,
                  fontSize: 13, fontWeight: 700, cursor: "pointer",
                  fontFamily: "inherit", transition: "all 0.2s",
                }}
              >
                {g === "masculine" ? "👦 He/Him" : "👧 She/Her"}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: HUM_PALETTE.muted, fontWeight: 600, textAlign: "center", marginTop: -4 }}>
            This personalises the Hinglish copy in the app
          </div>

          {error && <div style={{ color: HUM_PALETTE.deep, fontSize: 13, fontWeight: 600 }}>{error}</div>}

          <button
            onClick={handleSignup}
            disabled={loading || !name || !email || !password || !gender}
            style={{
              padding: "16px", borderRadius: 18,
              background: HUM_PALETTE.terracotta, color: "white",
              border: "none", fontSize: 15, fontWeight: 700,
              cursor: "pointer", marginTop: 4,
              boxShadow: "0 6px 20px rgba(212,120,90,0.3)",
              fontFamily: "inherit",
              opacity: (loading || !name || !email || !password || !gender) ? 0.6 : 1,
            }}
          >
            {loading ? "Creating account..." : "Let's go 🚀"}
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: HUM_PALETTE.muted, fontWeight: 600 }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: HUM_PALETTE.terracotta, fontWeight: 700, textDecoration: "none" }}>
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
