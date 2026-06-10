// src/app/api/ping/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

const PING_MESSAGES: Record<string, string> = {
  thinking:  "is thinking of you 💭",
  missing:   "is missing you 🥺",
  amazing:   "thinks you're amazing 🔥",
  hug:       "is sending you a hug 🤗",
  cant_sleep: "can't sleep 😴",
  love:      "loves you 🩷",
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { to_user_id, type } = await req.json();

  // save ping to DB
  const { data, error } = await supabase
    .from("pings")
    .insert({ from_user_id: user.id, to_user_id, type })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // get sender name
  const { data: sender } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single();

  // get recipient push subscription
  const { data: sub } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", to_user_id)
    .single();

  if (sub && sender) {
    try {
      const message = PING_MESSAGES[type] ?? "sent you a ping";
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({
          title: `${sender.name} 🩷`,
          body:  `${sender.name} ${message}`,
          url:   "/home",
        })
      );
    } catch (e) {
      console.error("Push failed:", e);
    }
  }

  return NextResponse.json({ ping: data });
}