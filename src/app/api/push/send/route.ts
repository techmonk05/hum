// src/app/api/push/send/route.ts
import webpush from "web-push";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { to_user_id, title, body, url } = await req.json();

  const { data: sub } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", to_user_id)
    .single();

  if (!sub) return NextResponse.json({ error: "No subscription" }, { status: 404 });

  await webpush.sendNotification(
    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
    JSON.stringify({ title, body, url })
  );

  return NextResponse.json({ ok: true });
}