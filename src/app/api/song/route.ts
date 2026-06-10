// src/app/api/song/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const FALLBACK_MOODS = [
  { query: "The Weeknd",           label: "Dark & moody 🌙" },
  { query: "Drake",                label: "Vibes only 🎵" },
  { query: "Radiohead",            label: "Chill vibes only 🌙" },
  { query: "The 1975",             label: "Soulful mood 🎷" },
  { query: "Cigarettes After Sex", label: "Indie vibes 🎸" },
  { query: "Conan Gray",           label: "Dreamy feels 🌸" },
  { query: "Arijit Singh",         label: "Something romantic 🌹" },
  { query: "Tyler The Creator",    label: "Creative energy 🎨" },
];

async function getSpotifyToken(): Promise<string> {
  const clientId     = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Spotify credentials missing");

  const creds = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res   = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { Authorization: `Basic ${creds}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`Spotify auth failed (${res.status}): ${text}`);
  const data = JSON.parse(text);
  if (!data.access_token) throw new Error("No access token");
  return data.access_token;
}

function formatTrack(track: any, label: string) {
  return {
    id:         track.id,
    name:       track.name,
    artist:     track.artists?.map((a: any) => a.name).join(", ") ?? "Unknown",
    album:      track.album?.name ?? "Unknown Album",
    albumArt:   track.album?.images?.[0]?.url ?? null,
    previewUrl: track.preview_url ?? null,
    spotifyUrl: track.external_urls?.spotify ?? null,
    mood:       label,
  };
}

const parseArtists = (arr: any[]): string[] =>
  arr.flatMap(a => {
    if (!a) return [];
    if (typeof a === "string" && a.startsWith("[")) {
      try { return JSON.parse(a); } catch { return [a]; }
    }
    return [a];
  }).filter(Boolean);

async function searchTracks(query: string, token: string): Promise<any[]> {
  const res  = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  );
  const text = await res.text();
  console.log(`Search "${query}" status:`, res.status, text.slice(0, 200));
  if (!res.ok || !text.trim()) return [];
  const data = JSON.parse(text);
  return data.tracks?.items ?? [];
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: myProfile } = await supabase
      .from("profiles")
      .select("couple_id, favourite_artists")
      .eq("id", user.id)
      .single();

    const myArtists: string[] = myProfile?.favourite_artists ?? [];

    let partnerArtists: string[] = [];
    if (myProfile?.couple_id) {
      const { data: couple } = await supabase
        .from("couples")
        .select("user1_id, user2_id")
        .eq("id", myProfile.couple_id)
        .single();

      const partnerId = couple?.user1_id === user.id ? couple?.user2_id : couple?.user1_id;
      if (partnerId) {
        const { data: partnerProfile } = await supabase
          .from("profiles")
          .select("favourite_artists")
          .eq("id", partnerId)
          .single();
        partnerArtists = partnerProfile?.favourite_artists ?? [];
      }
    }

    const allArtists   = [...new Set([...parseArtists(myArtists), ...parseArtists(partnerArtists)])];
    const token        = await getSpotifyToken();
    console.log("token received:", !!token, token?.slice(0, 20));
    const daySeed      = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const url          = new URL(request.url);
    const refreshParam = url.searchParams.get("refresh");
    const effectiveSeed = refreshParam ? daySeed + parseInt(refreshParam) : daySeed;

    console.log("allArtists:", allArtists);
    console.log("effectiveSeed:", effectiveSeed);

    let track: any = null;
    let label      = "Today's pick 🎵";

    if (allArtists.length > 0) {
      const artist = allArtists[effectiveSeed % allArtists.length];
      console.log("Searching artist:", artist);
      const tracks = await searchTracks(artist, token);
      console.log("tracks found:", tracks.length);
      if (tracks.length) {
        track = tracks[(effectiveSeed * 7 + 13) % tracks.length];
        label = `Picked for you 🎵`;
        console.log("picked:", track?.name, "by", track?.artists?.[0]?.name);
      }
    }

    // fallback
    if (!track) {
      const mood   = FALLBACK_MOODS[effectiveSeed % FALLBACK_MOODS.length];
      label        = mood.label;
      console.log("falling back to:", mood.query);
      const tracks = await searchTracks(mood.query, token);
      if (tracks.length) track = tracks[(effectiveSeed * 3 + 5) % tracks.length];
    }

    if (!track) return NextResponse.json({ error: "No tracks found" }, { status: 404 });
    return NextResponse.json({ song: formatTrack(track, label) });

  } catch (error) {
    console.error("Spotify error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch song" },
      { status: 500 }
    );
  }
}