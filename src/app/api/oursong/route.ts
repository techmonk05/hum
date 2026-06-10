// src/app/api/oursong/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function getSpotifyToken(): Promise<string> {
  const creds = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");
  const res  = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { Authorization: `Basic ${creds}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  const data = await res.json();
  return data.access_token;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = await getSpotifyToken();

    // search specifically for About You by The 1975
    const res  = await fetch(
      `https://api.spotify.com/v1/search?q=About+You+The+1975&type=track&limit=5`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
    );
    const data = await res.json();
    const tracks = data.tracks?.items ?? [];

    // find the exact track
    const track = tracks.find((t: any) =>
      t.name.toLowerCase().includes("about you") &&
      t.artists.some((a: any) => a.name.toLowerCase().includes("1975"))
    ) ?? tracks[0];

    if (!track) return NextResponse.json({ error: "Song not found" }, { status: 404 });

    return NextResponse.json({
      song: {
        name:       track.name,
        artist:     track.artists.map((a: any) => a.name).join(", "),
        albumArt:   track.album.images[0]?.url ?? null,
        previewUrl: track.preview_url ?? null,
        spotifyUrl: track.external_urls.spotify,
      }
    });
  } catch (e) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}