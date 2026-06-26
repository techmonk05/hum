// src/app/(app)/reminders/page.tsx
"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { HUM_PALETTE } from "@/lib/constants";
import AddReminderSheet from "@/components/shared/AddReminderSheet";
import type { User } from "@/types";

type RepeatRule = "none" | "daily" | "weekdays" | "weekly" | "monthly";

interface Reminder {
  id: string;
  title: string;
  due_date: string | null;
  completed: boolean;
  created_at: string;
  repeat_rule: RepeatRule;
}

const REPEAT_LABEL: Record<RepeatRule, string> = {
  none: "", daily: "Every day", weekdays: "Weekdays", weekly: "Every week", monthly: "Every month",
};

function nextOccurrence(date: Date, rule: RepeatRule): Date {
  const next = new Date(date);
  if (rule === "daily") next.setDate(next.getDate() + 1);
  if (rule === "weekly") next.setDate(next.getDate() + 7);
  if (rule === "monthly") next.setMonth(next.getMonth() + 1);
  if (rule === "weekdays") {
    next.setDate(next.getDate() + 1);
    while (next.getDay() === 0 || next.getDay() === 6) next.setDate(next.getDate() + 1);
  }
  return next;
}

function formatRelative(dateStr: string): { label: string; tone: "overdue" | "today" | "soon" | "later" } {
  const date = new Date(dateStr);
  const now  = new Date();
  const diffMs   = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const time = date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

  if (diffMs < 0)     return { label: `Overdue · ${time}`, tone: "overdue" };
  if (diffDays === 0) return { label: `Today · ${time}`, tone: "today" };
  if (diffDays === 1) return { label: `Tomorrow · ${time}`, tone: "soon" };
  if (diffDays < 7)   return { label: `${date.toLocaleDateString("en-IN", { weekday: "long" })} · ${time}`, tone: "soon" };
  return { label: `${date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · ${time}`, tone: "later" };
}

const TONE_COLOR = {
  overdue: "#E8856A", today: HUM_PALETTE.terracotta, soon: "#C9A876", later: HUM_PALETTE.muted,
};

function ReminderRow({ reminder, onComplete, onDelete, isLast }: {
  reminder: Reminder; onComplete: () => void; onDelete: () => void; isLast: boolean;
}) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [resolved, setResolved] = useState(false);
  const startX = useRef(0);

  const relative = reminder.due_date ? formatRelative(reminder.due_date) : null;
  const tone = relative?.tone ?? "later";
  const color = TONE_COLOR[tone];
  const isRecurring = reminder.repeat_rule !== "none";

  const handleStart = (clientX: number) => { startX.current = clientX; setDragging(true); };
  const handleMove = (clientX: number) => {
    if (!dragging) return;
    setDragX(Math.max(-120, Math.min(120, clientX - startX.current)));
  };
  const handleEnd = () => {
    setDragging(false);
    if (dragX > 70) { setResolved(true); setTimeout(onComplete, 220); }
    else if (dragX < -70) { setResolved(true); setTimeout(onDelete, 220); }
    else setDragX(0);
  };

  return (
    <div style={{ position: "relative", marginBottom: isLast ? 0 : 2 }}>
      <div style={{
        position: "absolute", inset: 0, borderRadius: 16,
        display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px",
        background: dragX > 0 ? "linear-gradient(90deg, rgba(212,120,90,0.25), transparent)"
          : dragX < 0 ? "linear-gradient(270deg, rgba(192,97,107,0.25), transparent)" : "transparent",
        opacity: Math.min(Math.abs(dragX) / 70, 1),
      }}>
        <span style={{ fontSize: 16, color: HUM_PALETTE.terracotta, fontWeight: 700, opacity: dragX > 20 ? 1 : 0 }}>
          {isRecurring ? "↻ Done for now" : "✓ Done"}
        </span>
        <span style={{ fontSize: 16, color: "#C0616B", fontWeight: 700, opacity: dragX < -20 ? 1 : 0 }}>Remove ×</span>
      </div>

      <div
        onMouseDown={e => handleStart(e.clientX)}
        onMouseMove={e => handleMove(e.clientX)}
        onMouseUp={handleEnd}
        onMouseLeave={() => dragging && handleEnd()}
        onTouchStart={e => handleStart(e.touches[0].clientX)}
        onTouchMove={e => handleMove(e.touches[0].clientX)}
        onTouchEnd={handleEnd}
        style={{
          position: "relative", background: "#15101080", backdropFilter: "blur(8px)",
          border: "1px solid #2D1820", borderRadius: 16, padding: "16px 18px",
          display: "flex", alignItems: "center", gap: 14,
          transform: `translateX(${dragX}px) scale(${resolved ? 0.92 : 1})`,
          opacity: resolved ? 0 : 1,
          transition: dragging ? "none" : "transform 0.25s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s",
          cursor: "grab", touchAction: "pan-y", userSelect: "none",
        }}
      >
        <div style={{
          width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0,
          boxShadow: tone === "today" || tone === "overdue" ? `0 0 10px ${color}` : "none",
        }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              fontSize: 15, fontWeight: 600, color: HUM_PALETTE.brown,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {reminder.title}
            </div>
            {isRecurring && <span style={{ fontSize: 11, color: HUM_PALETTE.muted, flexShrink: 0 }}>↻</span>}
          </div>
          <div style={{ fontSize: 11.5, fontWeight: 600, color, marginTop: 3, letterSpacing: 0.2, display: "flex", gap: 6 }}>
            {relative && <span>{relative.label}</span>}
            {isRecurring && (
              <span style={{ color: HUM_PALETTE.muted }}>
                {relative ? "· " : ""}{REPEAT_LABEL[reminder.repeat_rule]}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RemindersPage() {
  const [me, setMe]               = useState<User | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showSheet, setShowSheet] = useState(false);
  const [toast, setToast]         = useState({ show: false, msg: "" });
  const router = useRouter();

  const showToast = (msg: string) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: "" }), 2200);
  };

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { router.push("/login"); return; }

      const { data: profile } = await supabase
        .from("profiles").select("*").eq("id", authUser.id).single();
      setMe(profile);

      const { data: reminderData } = await supabase
        .from("reminders")
        .select("*")
        .eq("user_id", authUser.id)
        .order("completed", { ascending: true })
        .order("due_date", { ascending: true, nullsFirst: false });

      if (reminderData) setReminders(reminderData as Reminder[]);
      setLoading(false);
    };
    load();
  }, []);

  const handleSheetSave = async (data: { title: string; dueDate: Date | null; repeat: RepeatRule }) => {
    if (!me) return;
    const supabase = createClient();

    const { data: created, error } = await supabase
      .from("reminders")
      .insert({
        user_id:     me.id,
        title:       data.title,
        due_date:    data.dueDate ? data.dueDate.toISOString() : null,
        repeat_rule: data.repeat,
      })
      .select()
      .single();

    if (error) { showToast("Couldn't save that — try again"); return; }

    setReminders(prev => [created as Reminder, ...prev].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }));
    setShowSheet(false);
    showToast(data.repeat !== "none" ? "Set to repeat 🔁" : "Added 🔔");
  };

  const handleComplete = async (reminder: Reminder) => {
    const supabase = createClient();

    if (reminder.repeat_rule !== "none" && reminder.due_date) {
      const next = nextOccurrence(new Date(reminder.due_date), reminder.repeat_rule);
      const { data } = await supabase
        .from("reminders")
        .update({ due_date: next.toISOString(), completed: false })
        .eq("id", reminder.id)
        .select()
        .single();
      if (data) {
        setReminders(prev => prev.map(r => r.id === reminder.id ? (data as Reminder) : r));
        showToast(`Next: ${next.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" })} 🔁`);
      }
    } else {
      const { data } = await supabase
        .from("reminders")
        .update({ completed: true })
        .eq("id", reminder.id)
        .select()
        .single();
      if (data) setReminders(prev => prev.map(r => r.id === reminder.id ? (data as Reminder) : r));
    }
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    await supabase.from("reminders").delete().eq("id", id);
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const { pending, completed } = useMemo(() => ({
    pending:   reminders.filter(r => !r.completed),
    completed: reminders.filter(r => r.completed),
  }), [reminders]);

  // Schedule client-side notifications for reminders due within 24 hours
  useEffect(() => {
    if (!("Notification" in window)) return;
    const schedule = () => {
      const now = Date.now();
      pending.forEach(r => {
        if (!r.due_date) return;
        const delay = new Date(r.due_date).getTime() - now;
        if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
          setTimeout(() => {
            new Notification(r.title, {
              body: "Reminder from Hum 🩷",
              icon: "/icons/icon-192x192.png",
              tag: r.id,
            });
          }, delay);
        }
      });
    };
    if (Notification.permission === "granted") {
      schedule();
    } else if (Notification.permission === "default") {
      Notification.requestPermission().then(p => { if (p === "granted") schedule(); });
    }
  }, [pending]);

  const grouped = useMemo(() => {
    const buckets: Record<string, Reminder[]> = { overdue: [], today: [], upcoming: [], someday: [] };
    for (const r of pending) {
      if (!r.due_date) { buckets.someday.push(r); continue; }
      const { tone } = formatRelative(r.due_date);
      if (tone === "overdue") buckets.overdue.push(r);
      else if (tone === "today") buckets.today.push(r);
      else buckets.upcoming.push(r);
    }
    return buckets;
  }, [pending]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: HUM_PALETTE.terracotta, fontStyle: "italic" }}>
          Hum...
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="blob" style={{ width: 280, height: 280, background: HUM_PALETTE.peach, top: -80, right: -60, opacity: 0.5 }} />

      <div style={{
        position: "fixed", bottom: 100, left: "50%",
        transform: `translateX(-50%) translateY(${toast.show ? 0 : 20}px)`,
        background: HUM_PALETTE.brown, color: "#120C10",
        padding: "10px 22px", borderRadius: 50, fontSize: 13, fontWeight: 700,
        opacity: toast.show ? 1 : 0, transition: "all 0.3s ease",
        pointerEvents: "none", zIndex: 200, whiteSpace: "nowrap",
      }}>
        {toast.msg}
      </div>

      <div style={{ padding: "56px 24px 20px" }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, color: HUM_PALETTE.brown, fontStyle: "italic", letterSpacing: -0.5 }}>
          Reminders
        </div>
        <div style={{ fontSize: 13, color: HUM_PALETTE.muted, fontWeight: 500, marginTop: 4 }}>
          {pending.length === 0 ? "All clear — nothing pending" : `${pending.length} thing${pending.length === 1 ? "" : "s"} to remember`}
        </div>
      </div>

      <div style={{ padding: "0 24px 8px" }}>
        <button
          onClick={() => setShowSheet(true)}
          style={{
            width: "100%", background: HUM_PALETTE.terracotta, color: HUM_PALETTE.warm,
            border: "none", borderRadius: 18, padding: "16px 20px",
            fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: "0 6px 20px rgba(212,120,90,0.25)",
          }}
        >
          <span style={{ fontSize: 18 }}>+</span> Add a reminder
        </button>
      </div>

      <div style={{ padding: "12px 24px 0" }}>
        {grouped.overdue.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: TONE_COLOR.overdue, marginBottom: 10 }}>Overdue</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {grouped.overdue.map((r, i) => (
                <ReminderRow key={r.id} reminder={r} isLast={i === grouped.overdue.length - 1}
                  onComplete={() => handleComplete(r)} onDelete={() => handleDelete(r.id)} />
              ))}
            </div>
          </div>
        )}

        {grouped.today.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: TONE_COLOR.today, marginBottom: 10 }}>Today</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {grouped.today.map((r, i) => (
                <ReminderRow key={r.id} reminder={r} isLast={i === grouped.today.length - 1}
                  onComplete={() => handleComplete(r)} onDelete={() => handleDelete(r.id)} />
              ))}
            </div>
          </div>
        )}

        {grouped.upcoming.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: HUM_PALETTE.muted, marginBottom: 10 }}>Upcoming</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {grouped.upcoming.map((r, i) => (
                <ReminderRow key={r.id} reminder={r} isLast={i === grouped.upcoming.length - 1}
                  onComplete={() => handleComplete(r)} onDelete={() => handleDelete(r.id)} />
              ))}
            </div>
          </div>
        )}

        {grouped.someday.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: HUM_PALETTE.muted, marginBottom: 10 }}>No date</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {grouped.someday.map((r, i) => (
                <ReminderRow key={r.id} reminder={r} isLast={i === grouped.someday.length - 1}
                  onComplete={() => handleComplete(r)} onDelete={() => handleDelete(r.id)} />
              ))}
            </div>
          </div>
        )}

        {pending.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 20px", color: HUM_PALETTE.muted }}>
            <div style={{ fontSize: 36, marginBottom: 10, opacity: 0.6 }}>○</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Nothing on your mind right now</div>
            <div style={{ fontSize: 12, marginTop: 4, opacity: 0.8 }}>Tap "Add a reminder" above</div>
          </div>
        )}

        {completed.length > 0 && (
          <div style={{ marginTop: 8, marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: HUM_PALETTE.muted, opacity: 0.5, marginBottom: 10 }}>
              Done · {completed.length}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {completed.slice(0, 5).map(r => (
                <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 12, background: "#15101050", opacity: 0.55 }}>
                  <span style={{ fontSize: 12, color: HUM_PALETTE.terracotta }}>✓</span>
                  <span style={{ fontSize: 13, color: HUM_PALETTE.muted, textDecoration: "line-through", flex: 1 }}>{r.title}</span>
                  <button onClick={() => handleDelete(r.id)} style={{ background: "none", border: "none", color: HUM_PALETTE.muted, fontSize: 14, cursor: "pointer", padding: 2 }}>×</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ height: 24 }} />

      {showSheet && (
        <AddReminderSheet
          onClose={() => setShowSheet(false)}
          onSave={handleSheetSave}
        />
      )}
    </div>
  );
}
