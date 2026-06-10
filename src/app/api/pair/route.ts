// src/app/api/pair/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { invite_code } = await req.json();

  // Find the partner by invite code
  const { data: partner, error: partnerErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("invite_code", invite_code.toUpperCase())
    .single();

  if (partnerErr || !partner) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
  }

  if (partner.id === user.id) {
    return NextResponse.json({ error: "You can't pair with yourself 💀" }, { status: 400 });
  }

  if (partner.couple_id) {
    return NextResponse.json({ error: "This person is already paired" }, { status: 400 });
  }

  // Create the couple
  const { data: couple, error: coupleErr } = await supabase
    .from("couples")
    .insert({ user1_id: user.id, user2_id: partner.id })
    .select()
    .single();

  if (coupleErr) return NextResponse.json({ error: coupleErr.message }, { status: 500 });

  // Update both profiles with couple_id
  await supabase.from("profiles").update({ couple_id: couple.id }).eq("id", user.id);
  await supabase.from("profiles").update({ couple_id: couple.id }).eq("id", partner.id);

  return NextResponse.json({ couple });
}
