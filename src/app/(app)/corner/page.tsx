// src/app/(app)/corner/page.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { HUM_PALETTE } from "@/lib/constants";
import type { User } from "@/types";

const ACHAISHA_NAMES = [
  "Hey Jumbee 🩷",
  "Hey Voodoo Scooby Snack🩷",
  "Hey Achaisha 🌸",
];

const KARTHIK_NAMES = [
  "Hey Bugboy 🩷",
];

function Confetti({ active }: { active: boolean }) {
  const colors = ["#D4785A", "#F4A0A0", "#FFCBA4", "#FFE4D6", "#C0616B", "#fff"];
  return (
    <div style={{
      position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1000,
      overflow: "hidden",
    }}>
      {active && Array.from({ length: 60 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${Math.random() * 100}%`,
            top: "-20px",
            width: Math.random() * 10 + 6,
            height: Math.random() * 10 + 6,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            background: colors[Math.floor(Math.random() * colors.length)],
            animation: `confettiFall ${Math.random() * 2 + 2}s ease-in forwards`,
            animationDelay: `${Math.random() * 0.5}s`,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}
    </div>
  );
}

export default function OurCornerPage() {
  const [me, setMe]                 = useState<User | null>(null);
  const [loading, setLoading]       = useState(true);
  const [greeting, setGreeting]     = useState("");
  const [showEaster, setShowEaster] = useState(false);
  const [easterInput, setEasterInput] = useState("");
  const [easterTriggered, setEasterTriggered] = useState(false);
  const [confetti, setConfetti]     = useState(false);
  const [baunaMode, setBaunaMode]   = useState(false);
  const [ourSong, setOurSong]       = useState<any>(null);
  const [songLoading, setSongLoading] = useState(true);
  const [playing, setPlaying]       = useState(false);
  const audioRef                    = useRef<HTMLAudioElement | null>(null);
  const router                      = useRouter();

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { router.push("/login"); return; }
      const { data: profile } = await supabase
        .from("profiles").select("*").eq("id", authUser.id).single();
      setMe(profile);

        // set greeting based on gender
        if (profile?.gender === "feminine") {
          // cycle through names based on day so it changes daily
          const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % ACHAISHA_NAMES.length;
          setGreeting(ACHAISHA_NAMES[dayIndex]);
        }

      setLoading(false);
    };
    load();
  }, []);

      // fetch our song — About You by The 1975
      useEffect(() => {
    const fetchOurSong = async () => {
      try {
        const res  = await fetch("/api/oursong");
        const data = await res.json();
        if (data.song) setOurSong(data.song);
      } catch {}
      setSongLoading(false);
    };
    fetchOurSong();
  }, []);

  const handleEasterSubmit = () => {
    if (easterInput.trim() === "293") {
      setEasterTriggered(true);
      setConfetti(true);
      setTimeout(() => setConfetti(false), 4000);
      setTimeout(() => setEasterTriggered(false), 8000);
    } else {
      setEasterInput("");
    }
  };

  const handleBauna = () => {
    const targetScale = 0.4;
    setBaunaMode(true);
    // also scale the <body> to include fixed elements
    try {
      const body = document.body;
      body.style.transition = "transform 0.15s cubic-bezier(0.34,1.56,0.64,1)";
      body.style.transformOrigin = "center center";
      body.style.transform = `scale(${targetScale})`;
    } catch (e) {}

    setTimeout(() => {
      try {
        const body = document.body;
        body.style.transform = "";
        body.style.transition = "";
      } catch (e) {}
      setBaunaMode(false);
    }, 5000);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: HUM_PALETTE.terracotta, fontStyle: "italic" }}>
          Hum...
        </div>
      </div>
    );
  }

  const scale = baunaMode ? 0.4 : 1;

  return (
    <>
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        @keyframes easterPop {
          0%   { transform: scale(0.8); opacity: 0; }
          60%  { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes baunaShrink {
          0%   { transform: scale(1); }
          20%  { transform: scale(${scale}); }
          80%  { transform: scale(${scale}); }
          100% { transform: scale(1); }
        }
      `}</style>

      <Confetti active={confetti} />

      <div
        className="screen"
        style={{
          transition: "transform 0.5s cubic-bezier(0.34,1.56,0.64,1)",
          transform: baunaMode ? `scale(${scale})` : "scale(1)",
          transformOrigin: "center center",
        }}
      >
        <div className="blob" style={{ width: 300, height: 300, background: HUM_PALETTE.peach, top: -80, right: -80 }} />

        {/* Header */}
        <div style={{
          padding: "56px 24px 28px",
          background: `linear-gradient(160deg, ${HUM_PALETTE.blush} 0%, ${HUM_PALETTE.warm} 60%)`,
          borderRadius: "0 0 32px 32px",
        }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: HUM_PALETTE.terracotta, fontStyle: "italic" }}>
            Our Corner 🩷
          </div>
          <div style={{ fontSize: 18, color: HUM_PALETTE.brown, fontWeight: 700, marginTop: 8, fontFamily: "'Playfair Display', serif" }}>
            {greeting}
          </div>
          <div style={{ fontSize: 12, color: HUM_PALETTE.muted, fontWeight: 600, marginTop: 4 }}>
            just for us ✦
          </div>
        </div>

        {/* Our Song */}
        <div className="section-title">Our Song 🎵</div>
        <div style={{ padding: "0 24px" }}>
          {songLoading ? (
            <div style={{ background: "#1A1014", border: "1.5px solid #2D1820", borderRadius: 20, padding: 20, textAlign: "center", color: HUM_PALETTE.muted, fontSize: 13 }}>
              Loading our song... 🎵
            </div>
          ) : ourSong ? (
            <div style={{ background: "#1A1014", border: "1.5px solid #2D1820", borderRadius: 24, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.4)" }}>
              {ourSong.albumArt && (
                <div style={{ position: "relative", width: "100%", height: 200 }}>
                  <img src={ourSong.albumArt} alt={ourSong.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #1A1014 0%, transparent 60%)" }} />
                  <div style={{
                    position: "absolute", top: 12, left: 12,
                    background: "rgba(212,120,90,0.9)", backdropFilter: "blur(8px)",
                    borderRadius: 50, padding: "4px 14px",
                    fontSize: 11, fontWeight: 700, color: "white",
                  }}>
                    Our Song 🩷
                  </div>
                </div>
              )}
              <div style={{ padding: "16px 20px" }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: "#F5DDD0", marginBottom: 4 }}>
                  {ourSong.name}
                </div>
                <div style={{ fontSize: 13, color: HUM_PALETTE.muted, fontWeight: 600, marginBottom: 16 }}>
                  {ourSong.artist}
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  {ourSong.previewUrl && (
                    <button
                      onClick={() => {
                        if (!audioRef.current) {
                          audioRef.current = new Audio(ourSong.previewUrl);
                          audioRef.current.onended = () => setPlaying(false);
                        }
                        if (playing) { audioRef.current.pause(); audioRef.current.currentTime = 0; setPlaying(false); }
                        else { audioRef.current.play(); setPlaying(true); }
                      }}
                      style={{ flex: 1, padding: "12px", background: HUM_PALETTE.terracotta, color: "white", border: "none", borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                    >
                      {playing ? "⏹ Stop" : "▶ Preview"}
                    </button>
                  )}
                  <a
                    href={ourSong.spotifyUrl} target="_blank" rel="noopener noreferrer"
                    style={{ flex: 1, padding: "12px", background: "transparent", border: "1.5px solid #2D1820", borderRadius: 14, fontSize: 14, fontWeight: 700, color: HUM_PALETTE.muted, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                  >
                    🎧 Open
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: "#1A1014", border: "1.5px solid #2D1820", borderRadius: 20, padding: 20, textAlign: "center" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: HUM_PALETTE.brown, marginBottom: 4 }}>About You</div>
              <div style={{ fontSize: 13, color: HUM_PALETTE.muted }}>The 1975 🩷</div>
              <a href="https://open.spotify.com/track/2gCsNOpiBaMNh20jQ5prf0" target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-block", marginTop: 12, padding: "10px 20px", background: HUM_PALETTE.terracotta, color: "white", borderRadius: 12, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                🎧 Open in Spotify
              </a>
            </div>
          )}
        </div>

        {/* 293 Easter egg */}
        <div className="section-title">Our Secret 🔢</div>
        <div style={{ padding: "0 24px" }}>
          {!showEaster ? (
            <button
              onClick={() => setShowEaster(true)}
              style={{ width: "100%", padding: "18px", background: "#1A1014", border: "1.5px solid #2D1820", borderRadius: 20, color: HUM_PALETTE.muted, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
            >
              You know what to type 🤫
            </button>
          ) : easterTriggered ? (
            <div style={{ background: "#1A1014", border: `2px solid ${HUM_PALETTE.terracotta}`, borderRadius: 24, padding: "32px 24px", textAlign: "center", animation: "easterPop 0.5s ease" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🩷</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: HUM_PALETTE.brown, marginBottom: 8 }}>
                293 🩷
              </div>
              <div style={{ fontSize: 14, color: HUM_PALETTE.muted, fontWeight: 600, lineHeight: 1.6 }}>
                You said yes on Jan 7, 2025 at 2:47am.<br />
                I waited 3 years for that moment.<br />
                It was worth every single one. 🌙
              </div>
            </div>
          ) : (
            <div style={{ background: "#1A1014", border: "1.5px solid #2D1820", borderRadius: 20, padding: "20px" }}>
              <input
                autoFocus
                value={easterInput}
                onChange={e => setEasterInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleEasterSubmit()}
                placeholder="enter the magic number..."
                style={{ width: "100%", padding: "14px 16px", background: "#120C10", border: "1.5px solid #2D1820", borderRadius: 14, fontSize: 18, fontWeight: 700, color: HUM_PALETTE.brown, outline: "none", fontFamily: "inherit", textAlign: "center", letterSpacing: 4, marginBottom: 12 }}
              />
              <button
                onClick={handleEasterSubmit}
                style={{ width: "100%", padding: "12px", background: HUM_PALETTE.terracotta, color: "white", border: "none", borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
              >
                ✓
              </button>
            </div>
          )}
        </div>

        {/* Bauna mode */}
        <div className="section-title">Bauna Mode 💀</div>
        <div style={{ padding: "0 24px" }}>
          <button
            onClick={handleBauna}
            disabled={baunaMode}
            style={{ width: "100%", padding: "18px", background: "#1A1014", border: "1.5px solid #2D1820", borderRadius: 20, color: baunaMode ? HUM_PALETTE.terracotta : HUM_PALETTE.muted, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.3s" }}
          >
            {baunaMode ? "abe ye toh bauna hai 💀" : "tap to activate bauna mode 🫵"}
          </button>
        </div>

        <div style={{ height: 32 }} />
      </div>
    </>
  );
}