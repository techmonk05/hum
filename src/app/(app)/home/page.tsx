// src/app/(app)/home/page.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { HUM_PALETTE, PING_CONFIG } from "@/lib/constants";
import PairScreen from "@/components/shared/PairScreen";
import type { User, Couple } from "@/types";

interface GalleryPhoto {
  id: string;
  url: string;
  caption: string | null;
}

export default function HomePage() {
  const [me, setMe] = useState<User | null>(null);
  const [partner, setPartner] = useState<User | null>(null);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [loading, setLoading] = useState(true);
  const [sentPings, setSentPings] = useState<Record<number, boolean>>({});
  const [toast, setToast] = useState({ show: false, msg: "" });
  const [gallery, setGallery] = useState<GalleryPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [activePhoto, setActivePhoto] = useState(0);
  const [manageMode, setManageMode] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [refreshingSong, setRefreshingSong] = useState(false);

  const showToast = (msg: string) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: "" }), 2500);
  };
  type SongSuggestion = {
    id: string;
    name: string;
    artist: string;
    album: string;
    albumArt: string | null;
    spotifyUrl: string;
    previewUrl: string | null;
    mood: string;
  };

  const [song, setSong] = useState<SongSuggestion | null>(null);
  const [songSuggestions, setSongSuggestions] = useState<SongSuggestion[]>([]);
  const [songLoading, setSongLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const handleRefreshSong = async () => {
    setRefreshingSong(true);
    const today = new Date().toISOString().split("T")[0];
    // add a random offset to get a different track
    const songRes = await fetch(`/api/song?refresh=${Math.floor(Math.random() * 10000)}`);
    const songData = await songRes.json();
    if (songData.song) {
      setSong(songData.song);
      localStorage.setItem("hum_song", JSON.stringify({ date: today, song: songData.song }));
    }
    setRefreshingSong(false);
  };

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { router.push("/login"); return; }

      const { data: profile } = await supabase
        .from("profiles").select("*").eq("id", authUser.id).single();
      setMe(profile);

      if (profile?.couple_id) {
        const { data: coupleData } = await supabase
          .from("couples").select("*").eq("id", profile.couple_id).single();
        setCouple(coupleData);

        const partnerId = coupleData?.user1_id === authUser.id
          ? coupleData?.user2_id : coupleData?.user1_id;
        const { data: partnerProfile } = await supabase
          .from("profiles").select("*").eq("id", partnerId).single();
        setPartner(partnerProfile);

        // load gallery
        const { data: photos } = await supabase
          .from("gallery")
          .select("*")
          .eq("couple_id", profile.couple_id);
        if (photos) {
          const shuffled = [...photos].sort(() => Math.random() - 0.5);
          setGallery(shuffled);
        }
      }

      // load song of the day
      // load song of the day — cached per day
      const today = new Date().toISOString().split("T")[0];
      const cached = localStorage.getItem("hum_song");
      const cachedData = cached ? JSON.parse(cached) : null;

      if (cachedData?.date === today) {
        setSong(cachedData.song);
        setSongLoading(false);
      } else {
        const songRes = await fetch("/api/song");
        const songData = await songRes.json();
        if (songData.song) {
          setSong(songData.song);
          localStorage.setItem("hum_song", JSON.stringify({ date: today, song: songData.song }));
        }
        setSongLoading(false);
      }

      setLoading(false);
    };
    load();
  }, []);
  useEffect(() => {
    if (gallery.length <= 1) return;
    const interval = setInterval(() => {
      setActivePhoto(p => (p + 1) % gallery.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [gallery.length]);

  const handlePing = async (idx: number) => {
    if (!partner) return;
    const pingType = PING_CONFIG[idx].type;
    await fetch("/api/ping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to_user_id: partner.id, type: pingType }),
    });
    setSentPings(p => ({ ...p, [idx]: true }));
    showToast("Ping sent! 🩷");
    setTimeout(() => setSentPings(p => ({ ...p, [idx]: false })), 3000);
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !me || !couple) return;
    setUploading(true);


    const supabase = createClient();
    const uploaded: GalleryPhoto[] = [];


    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `${couple.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("gallery")
        .upload(path, file, { upsert: false });

      if (uploadErr) continue;

      const { data: { publicUrl } } = supabase.storage.from("gallery").getPublicUrl(path);

      const { data: photo } = await supabase
        .from("gallery")
        .insert({ couple_id: couple.id, uploaded_by: me.id, url: publicUrl })
        .select()
        .single();

      if (photo) uploaded.push(photo);
    }

    if (uploaded.length) {
      setGallery(prev => [...uploaded, ...prev]);
      setActivePhoto(0);
      showToast(`${uploaded.length} photo${uploaded.length > 1 ? "s" : ""} added! 📸`);
    } else {
      showToast("Upload failed 😭");
    }

    setUploading(false);
    if (galleryInputRef.current) galleryInputRef.current.value = "";
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

  if (!me) return null;
  if (!couple) return <PairScreen me={me} onPaired={() => window.location.reload()} />;
  const handleDeletePhoto = async (photo: GalleryPhoto) => {
    if (!couple) return;
    setDeleting(photo.id);
    const supabase = createClient();

    // extract path from url
    const path = photo.url.split("/gallery/")[1];
    await supabase.storage.from("gallery").remove([path]);
    await supabase.from("gallery").delete().eq("id", photo.id);

    setGallery(prev => prev.filter(p => p.id !== photo.id));
    setActivePhoto(0);
    setDeleting(null);
    showToast("Photo removed 🗑️");
  };

  return (
    <div className="screen">
      {/* Blobs */}
      <div className="blob" style={{ width: 300, height: 300, background: HUM_PALETTE.peach, top: -80, right: -80 }} />
      <div className="blob" style={{ width: 250, height: 250, background: HUM_PALETTE.rose, bottom: 100, left: -60 }} />

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
      <div style={{
        padding: "56px 24px 24px",
        background: `linear-gradient(160deg, ${HUM_PALETTE.blush} 0%, ${HUM_PALETTE.warm} 60%)`,
        borderRadius: "0 0 32px 32px",
      }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, color: HUM_PALETTE.terracotta }}>
          H<span style={{ fontStyle: "italic", color: HUM_PALETTE.deep }}>um</span> 🩷
        </div>

        {/* Couple avatars */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
          <div style={{ display: "flex" }}>
            {[me, partner].map((u, i) => (
              <div key={i} style={{
                width: 56, height: 56, borderRadius: "50%",
                border: "3px solid white",
                background: i === 0 ? HUM_PALETTE.peach : HUM_PALETTE.rose,
                overflow: "hidden", flexShrink: 0,
                marginLeft: i === 1 ? -16 : 0,
                zIndex: i === 0 ? 2 : 1,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 16px rgba(212,120,90,0.2)",
              }}>
                {u?.avatar_url
                  ? <img src={u.avatar_url} alt={u?.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontSize: 22 }}>{i === 0 ? "🧑" : "👩"}</span>}
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, color: HUM_PALETTE.brown, fontStyle: "italic" }}>
              {me.name} & {partner?.name}
            </div>
            <div style={{ fontSize: 11, color: HUM_PALETTE.muted, fontWeight: 600 }}>
              {me.name}&apos;s view ✦
            </div>
          </div>
        </div>
      </div>

      {/* Ping section */}
      <div className="section-title">Send a ping 🩷</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, padding: "0 24px" }}>
        {PING_CONFIG.map((p, i) => (
          <button
            key={i}
            onClick={() => handlePing(i)}
            style={{
              background: sentPings[i] ? HUM_PALETTE.blush : "white",
              border: `1.5px solid ${sentPings[i] ? HUM_PALETTE.terracotta : HUM_PALETTE.blush}`,
              borderRadius: 18, padding: "16px 8px",
              display: "flex", flexDirection: "column",
              alignItems: "center", gap: 6,
              cursor: "pointer",
              boxShadow: "0 2px 10px rgba(212,120,90,0.06)",
              transition: "all 0.2s",
              fontFamily: "inherit",
            }}
          >
            <span style={{ fontSize: 26 }}>{p.emoji}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: HUM_PALETTE.muted, textAlign: "center", lineHeight: 1.2 }}>
              {p.label}
            </span>
          </button>
        ))}
      </div>
      {/* Song of the day */}
      <div className="section-title">Song of the day 🎵</div>
      <div style={{ padding: "0 24px" }}>
        {songLoading ? (
          <div style={{ background: "#1A1014", border: "1.5px solid #2D1820", borderRadius: 20, padding: "20px", textAlign: "center", color: "#A67868", fontSize: 13 }}>
            Finding today&apos;s song... 🎵
          </div>
        ) : song ? (
          <div style={{
            background: "#1A1014", border: "1.5px solid #2D1820",
            borderRadius: 24, overflow: "hidden",
            boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
          }}>
            {/* Album art */}
            {song.albumArt && (
              <div style={{ position: "relative", width: "100%", height: 180 }}>
                <img src={song.albumArt} alt={song.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(to top, #1A1014 0%, transparent 60%)",
                }} />
                {/* Mood pill */}
                <div style={{
                  position: "absolute", top: 12, left: 12,
                  background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
                  borderRadius: 50, padding: "4px 12px",
                  fontSize: 11, fontWeight: 700, color: "#D4785A",
                }}>
                  {song.mood}
                </div>
              </div>
            )}

            {/* Song info */}
            <div style={{ padding: "16px 20px" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: "#F5DDD0", marginBottom: 4 }}>
                {song.name}
              </div>
              <div style={{ fontSize: 13, color: "#A67868", fontWeight: 600, marginBottom: 16 }}>
                {song.artist}
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                {song.previewUrl && (
                  <button
                    onClick={() => {
                      if (!audioRef.current) {
                        audioRef.current = new Audio(song.previewUrl!);
                        audioRef.current.onended = () => setPlaying(false);
                      }
                      if (playing) {
                        audioRef.current.pause();
                        audioRef.current.currentTime = 0;
                        setPlaying(false);
                      } else {
                        audioRef.current.play();
                        setPlaying(true);
                      }
                    }}
                    style={{
                      flex: 1, padding: "12px",
                      background: "#D4785A", color: "white",
                      border: "none", borderRadius: 14,
                      fontSize: 14, fontWeight: 700,
                      cursor: "pointer", fontFamily: "inherit",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}
                  >
                    {playing ? "⏹ Stop" : "▶ Preview"}
                  </button>
                )}

                <a
                  href={song.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1, padding: "12px",
                    background: "transparent",
                    border: "1.5px solid #2D1820",
                    borderRadius: 14,
                    fontSize: 14, fontWeight: 700,
                    color: "#A67868", textDecoration: "none",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}
                >
                  🎧 Open
                </a>
              </div>

              {/* Refresh button — full width below */}
              <button
                onClick={handleRefreshSong}
                disabled={refreshingSong}
                style={{
                  width: "100%", marginTop: 10, padding: "12px",
                  background: "transparent",
                  border: "1.5px solid #2D1820",
                  borderRadius: 14, fontSize: 13,
                  fontWeight: 700, color: "#A67868",
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                {refreshingSong ? "Finding another... 🎵" : "Not feeling it? Try another 🔀"}
              </button>

              {songSuggestions.length > 0 && (
                <div style={{ marginTop: 18, borderTop: "1.5px solid #2D1820", paddingTop: 16 }}>
                  <div style={{ fontSize: 13, color: "#F5DDD0", marginBottom: 10, fontWeight: 700 }}>
                    More song suggestions from Spotify
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
                    {songSuggestions.map((suggestion) => (
                      <a
                        key={suggestion.id}
                        href={suggestion.spotifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "block",
                          border: "1.5px solid #2D1820",
                          borderRadius: 18,
                          overflow: "hidden",
                          textDecoration: "none",
                          color: "inherit",
                          background: "#171212",
                        }}
                      >
                        {suggestion.albumArt ? (
                          <img src={suggestion.albumArt} alt={suggestion.name} style={{ width: "100%", height: 120, objectFit: "cover" }} />
                        ) : (
                          <div style={{ width: "100%", height: 120, background: "#2D1820" }} />
                        )}
                        <div style={{ padding: "10px", fontSize: 12 }}>
                          <div style={{ fontWeight: 700, marginBottom: 4 }}>{suggestion.name}</div>
                          <div style={{ color: "#A67868", fontSize: 11 }}>{suggestion.artist}</div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ background: "#1A1014", border: "1.5px solid #2D1820", borderRadius: 20, padding: "20px", textAlign: "center", color: "#A67868", fontSize: 13 }}>
            No song today 😔
          </div>
        )}
      </div>

      {/* Gallery */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 24px 12px" }}>
        <div className="section-title" style={{ padding: 0 }}>Our Photos 📸</div>
        {gallery.length > 0 && (
          <button
            onClick={() => setManageMode(m => !m)}
            style={{
              background: manageMode ? HUM_PALETTE.terracotta : "white",
              border: `1.5px solid ${manageMode ? HUM_PALETTE.terracotta : HUM_PALETTE.blush}`,
              color: manageMode ? "white" : HUM_PALETTE.muted,
              borderRadius: 50, padding: "6px 14px",
              fontSize: 12, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
              transition: "all 0.2s",
            }}
          >
            {manageMode ? "Done ✓" : "Manage"}
          </button>
        )}
      </div>

      <div style={{ padding: "0 24px" }}>
        {/* Upload button */}
        <label style={{ cursor: uploading ? "not-allowed" : "pointer" }}>
          <div style={{
            border: `2px dashed ${HUM_PALETTE.peach}`,
            borderRadius: 20, padding: "16px",
            display: "flex", alignItems: "center", gap: 12,
            background: "white", marginBottom: 12,
            opacity: uploading ? 0.6 : 1,
            transition: "opacity 0.2s",
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: HUM_PALETTE.blush,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, flexShrink: 0,
            }}>
              {uploading ? "⏳" : "📷"}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: HUM_PALETTE.brown }}>
                {uploading ? "Uploading..." : "Add photos"}
              </div>
              <div style={{ fontSize: 11, color: HUM_PALETTE.muted, fontWeight: 600, marginTop: 2 }}>
                Select multiple at once 🌸
              </div>
            </div>
          </div>
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: "none" }}
            onChange={handleGalleryUpload}
            disabled={uploading}
          />
        </label>

        {gallery.length > 0 ? (
          !manageMode ? (
            // SLIDESHOW MODE
            <div style={{ position: "relative" }}>
              <div style={{
                width: "100%", height: 480,
                borderRadius: 24, overflow: "hidden",
                border: `1.5px solid ${HUM_PALETTE.blush}`,
                boxShadow: "0 8px 32px rgba(212,120,90,0.15)",
                position: "relative",
                background: HUM_PALETTE.blush,
              }}>
                <img
                  src={gallery[activePhoto]?.url}
                  alt="memory"
                  style={{ width: "100%", height: "100%", objectFit: "contain", background: HUM_PALETTE.cream }}
                />
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  height: "40%",
                  background: "linear-gradient(to top, rgba(0,0,0,0.35), transparent)",
                  borderRadius: "0 0 24px 24px",
                }} />
              </div>
              {gallery.length > 1 && (
                <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 12 }}>
                  {gallery.map((_, i) => (
                    <div
                      key={i}
                      onClick={() => setActivePhoto(i)}
                      style={{
                        width: i === activePhoto ? 20 : 6,
                        height: 6, borderRadius: 10,
                        background: i === activePhoto ? HUM_PALETTE.terracotta : HUM_PALETTE.blush,
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            // MANAGE MODE — grid with delete buttons
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {gallery.map((photo) => (
                <div
                  key={photo.id}
                  style={{
                    aspectRatio: "1", borderRadius: 14,
                    overflow: "hidden", position: "relative",
                    border: `1.5px solid ${HUM_PALETTE.blush}`,
                  }}
                >
                  <img
                    src={photo.url}
                    alt="memory"
                    style={{ width: "100%", height: "100%", objectFit: "cover", opacity: deleting === photo.id ? 0.4 : 1 }}
                  />
                  <div
                    onClick={() => handleDeletePhoto(photo)}
                    style={{
                      position: "absolute", inset: 0,
                      background: "rgba(0,0,0,0.45)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer",
                      borderRadius: 14,
                    }}
                  >
                    {deleting === photo.id
                      ? <span style={{ fontSize: 24 }}>⏳</span>
                      : <div style={{
                        background: "rgba(255,255,255,0.9)",
                        borderRadius: "50%", width: 36, height: 36,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 18, fontWeight: 700, color: "#c0616b",
                      }}>🗑️</div>
                    }
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div style={{
            textAlign: "center", padding: "32px 0",
            color: HUM_PALETTE.muted, fontSize: 13, fontWeight: 600,
          }}>
            No photos yet — add your first one 🌸
          </div>
        )}
      </div>

      <div style={{ height: 16 }} />

      <div style={{ height: 16 }} />
    </div>
  );
}