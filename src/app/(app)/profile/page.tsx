// src/app/(app)/profile/page.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { HUM_PALETTE } from "@/lib/constants";
import type { User, Couple } from "@/types";

export default function ProfilePage() {
  const [me, setMe]               = useState<User | null>(null);
  const [partner, setPartner]     = useState<User | null>(null);
  const [couple, setCouple]       = useState<Couple | null>(null);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast]         = useState({ show: false, msg: "" });
  const [artists, setArtists]         = useState<string[]>([]);
  const [artistInput, setArtistInput] = useState("");
  const [savingArtists, setSavingArtists] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router  = useRouter();

  const showToast = (msg: string) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: "" }), 2500);
  };

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { router.push("/login"); return; }

      const { data: profile } = await supabase
        .from("profiles").select("*").eq("id", authUser.id).single();
      setMe(profile);
      if (profile?.favourite_artists?.length) setArtists(profile.favourite_artists);

      if (profile?.couple_id) {
        const { data: coupleData } = await supabase
          .from("couples").select("*").eq("id", profile.couple_id).single();
        setCouple(coupleData);

        const partnerId = coupleData?.user1_id === authUser.id
          ? coupleData?.user2_id : coupleData?.user1_id;
        const { data: partnerProfile } = await supabase
          .from("profiles").select("*").eq("id", partnerId).single();
        setPartner(partnerProfile);
      }

      setLoading(false);
    };
    load();
  }, []);

  const handleAddArtist = () => {
    if (!artistInput.trim()) return;
    setArtists(prev => [...prev, artistInput.trim()]);
    setArtistInput("");
  };

  const handleRemoveArtist = (idx: number) => {
    setArtists(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveArtists = async () => {
    if (!me) return;
    setSavingArtists(true);
    const supabase = createClient();
    await supabase.from("profiles")
      .update({ favourite_artists: artists })
      .eq("id", me.id);
    setSavingArtists(false);
    showToast("Artists saved! 🎵");
  };

  const handlePfpUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !me) return;
    setUploading(true);

    const supabase = createClient();
    const ext  = file.name.split(".").pop();
    const path = `${me.id}/avatar.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("avatars").upload(path, file, { upsert: true });

    if (uploadErr) { showToast("Upload failed 😭"); setUploading(false); return; }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", me.id);
    setMe(prev => prev ? { ...prev, avatar_url: publicUrl } : prev);
    showToast("Photo updated! 📸");
    setUploading(false);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const copyInviteCode = () => {
    if (!me) return;
    navigator.clipboard.writeText(me.invite_code);
    showToast("Invite code copied! 📋");
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: HUM_PALETTE.terracotta, fontStyle: "italic" }}>Hum...</div>
      </div>
    );
  }

  if (!me) return null;

  const SETTINGS = [
    { icon: "🔔", label: "Notifications",    action: () => showToast("Coming soon! ✨") },
    { icon: "🎨", label: "App theme",         action: () => showToast("Coming soon! ✨") },
    { icon: "🔗", label: "Share invite code", action: copyInviteCode },
    { icon: "💬", label: "Send feedback",     action: () => showToast("Coming soon! ✨") },
    { icon: "❤️", label: "About Hum",         action: () => showToast("Made with love 🩷") },
  ];

  return (
    <div className="screen">
      <div className="blob" style={{ width: 300, height: 300, background: HUM_PALETTE.peach, top: -80, right: -80 }} />

      {/* Toast */}
      <div style={{
        position: "fixed", bottom: 100, left: "50%",
        transform: `translateX(-50%) translateY(${toast.show ? 0 : 20}px)`,
        background: HUM_PALETTE.brown, color: "white",
        padding: "12px 24px", borderRadius: 50,
        fontSize: 13, fontWeight: 700,
        opacity: toast.show ? 1 : 0,
        transition: "all 0.3s ease",
        pointerEvents: "none", zIndex: 200, whiteSpace: "nowrap",
      }}>
        {toast.msg}
      </div>

      {/* Header */}
      <div style={{ padding: "56px 24px 32px", background: `linear-gradient(160deg, ${HUM_PALETTE.blush} 0%, ${HUM_PALETTE.warm} 60%)`, borderRadius: "0 0 32px 32px", textAlign: "center" }}>
        <div style={{ position: "relative", display: "inline-flex", alignItems: "center", marginBottom: 20 }}>
          <label style={{ cursor: "pointer", position: "relative" }}>
            <div style={{
              width: 88, height: 88, borderRadius: "50%",
              border: "3.5px solid white",
              boxShadow: "0 4px 20px rgba(212,120,90,0.2)",
              background: HUM_PALETTE.peach, overflow: "hidden",
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 2, position: "relative",
            }}>
              {uploading
                ? <span style={{ fontSize: 20 }}>⏳</span>
                : me.avatar_url
                  ? <img src={me.avatar_url} alt={me.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontSize: 34 }}>🧑</span>}
              <div style={{
                position: "absolute", inset: 0,
                background: "rgba(0,0,0,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, borderRadius: "50%", opacity: 0, transition: "opacity 0.2s",
              }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "0")}
              >📷</div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePfpUpload} />
          </label>

          <div style={{
            width: 88, height: 88, borderRadius: "50%",
            border: "3.5px solid white",
            boxShadow: "0 4px 20px rgba(212,120,90,0.2)",
            background: HUM_PALETTE.rose, overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginLeft: -20, zIndex: 1,
          }}>
            {partner?.avatar_url
              ? <img src={partner.avatar_url} alt={partner.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontSize: 34 }}>👩</span>}
          </div>
          <div style={{ position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%)", fontSize: 16, zIndex: 3 }}>💗</div>
        </div>

        <div style={{ fontSize: 11, color: HUM_PALETTE.muted, fontWeight: 600, marginBottom: 10 }}>
          Tap your photo to update it
        </div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: HUM_PALETTE.brown, fontStyle: "italic" }}>
          {me.name} & {partner?.name ?? "..."}
        </div>
        <div style={{ fontSize: 12, color: HUM_PALETTE.muted, fontWeight: 600, marginTop: 4 }}>
          Together since Jan 7 2025 🌸
        </div>
        <div style={{ marginTop: 6, fontSize: 12, color: HUM_PALETTE.terracotta, fontWeight: 700 }}>
          Logged in as {me.name} 🔐
        </div>
      </div>

      {/* Invite code */}
      <div style={{ margin: "16px 24px 0", background: "#1A1014", border: `1.5px solid #2D1820`, borderRadius: 20, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }} onClick={copyInviteCode}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: HUM_PALETTE.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Your invite code</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: HUM_PALETTE.terracotta, letterSpacing: 4 }}>{me.invite_code}</div>
        </div>
        <span style={{ fontSize: 20 }}>📋</span>
      </div>

      {/* Favourite artists */}
      <div style={{ margin: "16px 24px 0", background: "#1A1014", border: "1.5px solid #2D1820", borderRadius: 20, padding: "20px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: HUM_PALETTE.brown, marginBottom: 4 }}>
          🎵 Your favourite artists
        </div>
        <div style={{ fontSize: 11, color: HUM_PALETTE.muted, fontWeight: 600, marginBottom: 14 }}>
          Used to personalise your song of the day
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {artists.map((a, i) => (
            <div key={i} style={{
              background: "#2D1820", borderRadius: 50,
              padding: "6px 14px",
              display: "flex", alignItems: "center", gap: 8,
              fontSize: 13, fontWeight: 600, color: HUM_PALETTE.brown,
            }}>
              {a}
              <span onClick={() => handleRemoveArtist(i)} style={{ cursor: "pointer", color: HUM_PALETTE.muted, fontSize: 16, lineHeight: 1 }}>×</span>
            </div>
          ))}
          {artists.length === 0 && (
            <div style={{ fontSize: 12, color: HUM_PALETTE.muted, fontStyle: "italic" }}>No artists added yet</div>
          )}
        </div>

        {artists.length < 5 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input
              value={artistInput}
              onChange={e => setArtistInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAddArtist()}
              placeholder="e.g. Arijit Singh"
              style={{
                flex: 1, padding: "10px 14px",
                border: "1.5px solid #2D1820", borderRadius: 12,
                fontSize: 14, fontFamily: "inherit",
                color: HUM_PALETTE.brown, outline: "none", background: "#120C10",
              }}
            />
            <button
              onClick={handleAddArtist}
              disabled={!artistInput.trim()}
              style={{
                padding: "10px 16px", background: HUM_PALETTE.terracotta,
                color: "white", border: "none", borderRadius: 12,
                fontSize: 14, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
                opacity: !artistInput.trim() ? 0.5 : 1,
              }}
            >+</button>
          </div>
        )}

        <button
          onClick={handleSaveArtists}
          disabled={savingArtists}
          style={{
            width: "100%", padding: "12px",
            background: "#2D1820", color: HUM_PALETTE.terracotta,
            border: "1.5px solid #2D1820", borderRadius: 14,
            fontSize: 14, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          {savingArtists ? "Saving..." : "Save artists 🎵"}
        </button>
      </div>

      {/* Settings */}
      <div style={{ height: 24 }} />
      {SETTINGS.map((s, i) => (
        <div key={i} onClick={s.action} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 24px",
          borderBottom: `1px solid ${HUM_PALETTE.blush}`,
          cursor: "pointer",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 20 }}>{s.icon}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: HUM_PALETTE.brown }}>{s.label}</span>
          </div>
          <span style={{ color: HUM_PALETTE.muted, fontSize: 16 }}>›</span>
        </div>
      ))}

      {/* Sign out */}
      <div style={{ padding: "20px 24px" }}>
        <button
          onClick={handleSignOut}
          style={{
            width: "100%", padding: 14,
            background: "transparent",
            border: `1.5px solid ${HUM_PALETTE.blush}`,
            borderRadius: 16, color: HUM_PALETTE.muted,
            fontSize: 14, fontWeight: 700,
            fontFamily: "inherit", cursor: "pointer",
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}