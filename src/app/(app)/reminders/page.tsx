// src/app/(app)/reminders/page.tsx
"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { HUM_PALETTE } from "@/lib/constants";
import type { User } from "@/types";

interface Reminder {
  id: string;
  title: string;
  due_date: string | null;
  completed: boolean;
  created_at: string;
}

export default function RemindersPage() {
  const [me, setMe]               = useState<User | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading]     = useState(true);
  const [adding, setAdding]       = useState(false);
  const [newTitle, setNewTitle]   = useState("");
  const [newDate, setNewDate]     = useState("");
  const [toast, setToast]         = useState({ show: false, msg: "" });
  const [showPicker, setShowPicker]   = useState(false);
  const [pickerMonth, setPickerMonth] = useState(new Date().getMonth());
  const [pickerYear, setPickerYear]   = useState(new Date().getFullYear());
  const [pickerHour, setPickerHour]   = useState(9);
  const [pickerMin, setPickerMin]     = useState(0);
  const router = useRouter();
  const [completing, setCompleting] = useState<string | null>(null);

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

      const { data: reminderData } = await supabase
        .from("reminders")
        .select("*")
        .eq("user_id", authUser.id)
        .order("completed", { ascending: true })
        .order("due_date", { ascending: true, nullsFirst: false });

      if (reminderData) setReminders(reminderData);
      setLoading(false);
    };
    load();
  }, []);

  const handleAdd = async () => {
    if (!newTitle.trim() || !me) return;
    const supabase = createClient();

    const { data, error } = await supabase
      .from("reminders")
      .insert({
        user_id:  me.id,
        title:    newTitle.trim(),
        due_date: newDate ? new Date(newDate).toISOString() : null,
      })
      .select()
      .single();

    if (error) { showToast("Something went wrong 😭"); return; }
    setReminders(prev => [data, ...prev]);
    setNewTitle("");
    setNewDate("");
    setAdding(false);
    setShowPicker(false);
    showToast("Reminder added! 🔔");
  };

  const handleToggle = async (reminder: Reminder) => {
  if (!reminder.completed) {
    setCompleting(reminder.id);
    await new Promise(r => setTimeout(r, 400));
    setCompleting(null);
  }
  const supabase = createClient();
  const { data } = await supabase
    .from("reminders")
    .update({ completed: !reminder.completed })
    .eq("id", reminder.id)
    .select()
    .single();

  if (data) {
    setReminders(prev =>
      prev.map(r => r.id === reminder.id ? data : r)
        .sort((a, b) => Number(a.completed) - Number(b.completed))
    );
  }
};

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    await supabase.from("reminders").delete().eq("id", id);
    setReminders(prev => prev.filter(r => r.id !== id));
    showToast("Reminder removed 🗑️");
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now  = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0)   return { label: "Overdue",  color: HUM_PALETTE.deep };
    if (days === 0) return { label: "Today",     color: HUM_PALETTE.terracotta };
    if (days === 1) return { label: "Tomorrow",  color: HUM_PALETTE.orange };
    return {
      label: date.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) +
             " at " + date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      color: HUM_PALETTE.muted,
    };
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

  const pending   = reminders.filter(r => !r.completed);
  const completed = reminders.filter(r => r.completed);

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
      <div style={{
        padding: "56px 24px 24px",
        background: `linear-gradient(160deg, ${HUM_PALETTE.blush} 0%, ${HUM_PALETTE.warm} 60%)`,
        borderRadius: "0 0 32px 32px",
      }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: HUM_PALETTE.terracotta, fontStyle: "italic" }}>
          Reminders 🔔
        </div>
        <div style={{ fontSize: 13, color: HUM_PALETTE.muted, fontWeight: 600, marginTop: 4 }}>
          Just for you, {me?.name} 🌸
        </div>
      </div>

      {/* Add reminder */}
      <div style={{ padding: "20px 24px 0" }}>
        {!adding ? (
          <button
            onClick={() => setAdding(true)}
            style={{
              width: "100%", padding: "16px 20px",
              background: HUM_PALETTE.terracotta, color: "white",
              border: "none", borderRadius: 18,
              fontSize: 15, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
              boxShadow: "0 6px 20px rgba(212,120,90,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <span>+</span> Add a reminder
          </button>
        ) : (
          <div style={{
            background: "white", border: `1.5px solid ${HUM_PALETTE.blush}`,
            borderRadius: 20, padding: "20px",
            boxShadow: "0 4px 20px rgba(212,120,90,0.08)",
          }}>
            {/* Title */}
            <input
              autoFocus
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAdd()}
              placeholder="What do you need to remember? 🌸"
              style={{
                width: "100%", padding: "12px 16px",
                border: `1.5px solid ${HUM_PALETTE.blush}`,
                borderRadius: 14, fontSize: 15,
                fontFamily: "inherit", color: HUM_PALETTE.brown,
                outline: "none", marginBottom: 12,
                background: HUM_PALETTE.cream,
              }}
            />

            {/* Date picker trigger */}
            <button
              onClick={() => setShowPicker(p => !p)}
              style={{
                width: "100%", padding: "12px 16px",
                border: `1.5px solid ${showPicker ? HUM_PALETTE.terracotta : HUM_PALETTE.blush}`,
                borderRadius: 14, fontSize: 14,
                fontFamily: "inherit", color: newDate ? HUM_PALETTE.brown : HUM_PALETTE.muted,
                outline: "none", marginBottom: showPicker ? 8 : 16,
                background: HUM_PALETTE.cream,
                cursor: "pointer", textAlign: "left",
                display: "flex", alignItems: "center", gap: 8,
                transition: "border-color 0.2s",
              }}
            >
              <span>📅</span>
              <span>
                {newDate
                  ? new Date(newDate).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                  : "Set a date & time (optional)"}
              </span>
            </button>

            {/* Calendar */}
            {showPicker && (
              <div style={{
                background: HUM_PALETTE.cream,
                border: `1.5px solid ${HUM_PALETTE.blush}`,
                borderRadius: 18, padding: "16px",
                marginBottom: 16,
              }}>
                {/* Month nav */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <button
                    onClick={() => {
                      if (pickerMonth === 0) { setPickerMonth(11); setPickerYear(y => y - 1); }
                      else setPickerMonth(m => m - 1);
                    }}
                    style={{ background: HUM_PALETTE.blush, border: "none", borderRadius: 10, width: 34, height: 34, cursor: "pointer", fontSize: 18, fontWeight: 700, color: HUM_PALETTE.brown }}
                  >‹</button>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: HUM_PALETTE.brown }}>
                    {new Date(pickerYear, pickerMonth).toLocaleString("en-IN", { month: "long", year: "numeric" })}
                  </div>
                  <button
                    onClick={() => {
                      if (pickerMonth === 11) { setPickerMonth(0); setPickerYear(y => y + 1); }
                      else setPickerMonth(m => m + 1);
                    }}
                    style={{ background: HUM_PALETTE.blush, border: "none", borderRadius: 10, width: 34, height: 34, cursor: "pointer", fontSize: 18, fontWeight: 700, color: HUM_PALETTE.brown }}
                  >›</button>
                </div>

                {/* Day labels */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
                  {["S","M","T","W","T","F","S"].map((d, i) => (
                    <div key={i} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: HUM_PALETTE.muted, padding: "4px 0" }}>
                      {d}
                    </div>
                  ))}
                </div>

                {/* Days */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 14 }}>
                  {(() => {
                    const firstDay    = new Date(pickerYear, pickerMonth, 1).getDay();
                    const daysInMonth = new Date(pickerYear, pickerMonth + 1, 0).getDate();
                    const today        = new Date();
                    const selectedDate = newDate ? new Date(newDate) : null;
                    const cells: React.ReactNode[] = [];

                    for (let i = 0; i < firstDay; i++) {
                      cells.push(<div key={`e-${i}`} />);
                    }
                    for (let day = 1; day <= daysInMonth; day++) {
                      const date   = new Date(pickerYear, pickerMonth, day);
                      const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                      const isSel  = selectedDate &&
                        selectedDate.getDate() === day &&
                        selectedDate.getMonth() === pickerMonth &&
                        selectedDate.getFullYear() === pickerYear;
                      const isToday = today.getDate() === day &&
                        today.getMonth() === pickerMonth &&
                        today.getFullYear() === pickerYear;

                      cells.push(
                        <button
                          key={day}
                          disabled={isPast}
                          onClick={() => {
                            const d = new Date(pickerYear, pickerMonth, day, pickerHour, pickerMin);
                            setNewDate(d.toISOString().slice(0, 16));
                          }}
                          style={{
                            width: "100%", aspectRatio: "1",
                            borderRadius: 10, border: "none",
                            background: isSel ? HUM_PALETTE.terracotta : isToday ? HUM_PALETTE.peach : "white",
                            color: isSel ? "white" : isPast ? "#ccc" : HUM_PALETTE.brown,
                            fontSize: 13, fontWeight: isSel || isToday ? 700 : 400,
                            cursor: isPast ? "not-allowed" : "pointer",
                            transition: "all 0.15s",
                          }}
                        >
                          {day}
                        </button>
                      );
                    }
                    return cells;
                  })()}
                </div>

                {/* Time */}
                <div style={{
                  borderTop: `1px solid ${HUM_PALETTE.blush}`, paddingTop: 14,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap",
                }}>
                  <span style={{ fontSize: 13, color: HUM_PALETTE.muted, fontWeight: 600 }}>⏰ Time:</span>
                  <select
                    value={pickerHour}
                    onChange={e => {
                      const h = parseInt(e.target.value);
                      setPickerHour(h);
                      if (newDate) { const d = new Date(newDate); d.setHours(h); setNewDate(d.toISOString().slice(0, 16)); }
                    }}
                    style={{ padding: "6px 10px", borderRadius: 10, border: `1.5px solid ${HUM_PALETTE.blush}`, background: "white", fontSize: 14, fontWeight: 700, color: HUM_PALETTE.brown, fontFamily: "inherit", outline: "none", cursor: "pointer" }}
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>{String(i).padStart(2, "0")}</option>
                    ))}
                  </select>
                  <span style={{ fontWeight: 700, color: HUM_PALETTE.brown }}>:</span>
                  <select
                    value={pickerMin}
                    onChange={e => {
                      const m = parseInt(e.target.value);
                      setPickerMin(m);
                      if (newDate) { const d = new Date(newDate); d.setMinutes(m); setNewDate(d.toISOString().slice(0, 16)); }
                    }}
                    style={{ padding: "6px 10px", borderRadius: 10, border: `1.5px solid ${HUM_PALETTE.blush}`, background: "white", fontSize: 14, fontWeight: 700, color: HUM_PALETTE.brown, fontFamily: "inherit", outline: "none", cursor: "pointer" }}
                  >
                    {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                      <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
                    ))}
                  </select>
                  {newDate && (
                    <button
                      onClick={() => { setNewDate(""); setShowPicker(false); }}
                      style={{ padding: "6px 12px", background: "transparent", border: `1.5px solid ${HUM_PALETTE.blush}`, borderRadius: 10, fontSize: 12, fontWeight: 700, color: HUM_PALETTE.muted, cursor: "pointer", fontFamily: "inherit" }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Save / Cancel */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleAdd}
                disabled={!newTitle.trim()}
                style={{
                  flex: 1, padding: "12px",
                  background: HUM_PALETTE.terracotta, color: "white",
                  border: "none", borderRadius: 14,
                  fontSize: 14, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit",
                  opacity: !newTitle.trim() ? 0.6 : 1,
                }}
              >
                Save 🔔
              </button>
              <button
                onClick={() => { setAdding(false); setNewTitle(""); setNewDate(""); setShowPicker(false); }}
                style={{
                  flex: 1, padding: "12px", background: "transparent",
                  border: `1.5px solid ${HUM_PALETTE.blush}`, borderRadius: 14,
                  fontSize: 14, fontWeight: 600, color: HUM_PALETTE.muted,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <>
          <div className="section-title">To do ✦</div>
          <div style={{ padding: "0 24px", display: "flex", flexDirection: "column", gap: 10 }}>
            {pending.map((r, index) => {
              const dateInfo = r.due_date ? formatDate(r.due_date) : null;
                return (
                    <div key={r.id} className="reminder-item" style={{
                        animationDelay: `${index * 0.05}s`,
                        background: completing === r.id ? HUM_PALETTE.blush : "white",
                        border: `1.5px solid ${completing === r.id ? HUM_PALETTE.terracotta : HUM_PALETTE.blush}`,
                        borderRadius: 18, padding: "16px 18px",
                        display: "flex", alignItems: "center", gap: 14,
                        boxShadow: "0 2px 12px rgba(212,120,90,0.06)",
                        transition: "all 0.3s ease",
                    }}>
                  <button
                    onClick={() => handleToggle(r)}
                    style={{
                      width: 26, height: 26, borderRadius: "50%",
                      border: `2px solid ${HUM_PALETTE.peach}`,
                      background: "white", cursor: "pointer", flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: HUM_PALETTE.brown }}>{r.title}</div>
                    {dateInfo && (
                      <div style={{ fontSize: 11, fontWeight: 700, color: dateInfo.color, marginTop: 3 }}>
                        {dateInfo.label}
                      </div>
                    )}
                  </div>
                  <button onClick={() => handleDelete(r.id)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: HUM_PALETTE.muted, padding: 4 }}>×</button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <>
          <div className="section-title" style={{ opacity: 0.6 }}>Done ✓</div>
          <div style={{ padding: "0 24px", display: "flex", flexDirection: "column", gap: 10 }}>
            {completed.map(r => (
              <div key={r.id} style={{
                background: HUM_PALETTE.cream, border: `1.5px solid ${HUM_PALETTE.blush}`,
                borderRadius: 18, padding: "16px 18px",
                display: "flex", alignItems: "center", gap: 14, opacity: 0.7,
                }}>
                    <button
                        onClick={() => handleToggle(r)}
                        style={{
                            width: 26, height: 26, borderRadius: "50%",
                            border: `2px solid ${completing === r.id ? HUM_PALETTE.terracotta : HUM_PALETTE.peach}`,
                            background: completing === r.id ? HUM_PALETTE.terracotta : "white",
                            cursor: "pointer", flexShrink: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "white", fontSize: 13,
                            transition: "all 0.3s ease",
                            animation: completing === r.id ? "pop 0.3s ease" : "none",
                        }}
                    >
                        {completing === r.id ? "✓" : ""}
                    </button>
                <div style={{ flex: 1, fontSize: 14, color: HUM_PALETTE.muted, textDecoration: "line-through" }}>{r.title}</div>
                <button onClick={() => handleDelete(r.id)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: HUM_PALETTE.muted, padding: 4 }}>×</button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Empty state */}
      {reminders.length === 0 && !adding && (
        <div style={{ textAlign: "center", padding: "60px 32px", color: HUM_PALETTE.muted, fontSize: 14, fontWeight: 600 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
          No reminders yet — add one above!
        </div>
      )}

      <div style={{ height: 16 }} />
    </div>
  );
}