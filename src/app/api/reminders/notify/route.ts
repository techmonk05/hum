// src/app/api/reminders/notify/route.ts
import webpush from "web-push";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  // Find reminders due within the next 2 minutes (cron runs every minute)
  const now = new Date();
  const windowEnd = new Date(now.getTime() + 2 * 60 * 1000);

  const { data: reminders, error } = await supabase
    .from("reminders")
    .select("id, title, user_id, due_date")
    .eq("completed", false)
    .not("due_date", "is", null)
    .gte("due_date", now.toISOString())
    .lte("due_date", windowEnd.toISOString());

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!reminders?.length) return NextResponse.json({ sent: 0 });

  const userIds = [...new Set(reminders.map(r => r.user_id))];

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("user_id, endpoint, p256dh, auth")
    .in("user_id", userIds);

  const subMap = new Map((subs ?? []).map(s => [s.user_id, s]));

  let sent = 0;
  await Promise.allSettled(
    reminders.map(async (reminder) => {
      const sub = subMap.get(reminder.user_id);
      if (!sub) return;
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({
          title: reminder.title,
          body: "Reminder from Hum 🩷",
          url: "/reminders",
        })
      );
      sent++;
    })
  );

  return NextResponse.json({ sent });
}
