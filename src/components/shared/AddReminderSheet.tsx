// src/components/shared/AddReminderSheet.tsx
"use client";
import { useState } from "react";
import { HUM_PALETTE } from "@/lib/constants";
import AnalogTimePicker from "./AnalogTimePicker";
import CalendarPicker from "./CalendarPicker";

type RepeatRule = "none" | "daily" | "weekdays" | "weekly" | "monthly";

interface AddReminderSheetProps {
  onClose: () => void;
  onSave: (data: { title: string; dueDate: Date | null; repeat: RepeatRule }) => void;
}

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

function todayISO() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

export default function AddReminderSheet({ onClose, onSave }: AddReminderSheetProps) {
  const [title, setTitle]       = useState("");
  const [dateStr, setDateStr]   = useState(todayISO());
  const [timeStr, setTimeStr]   = useState("09:00");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [repeatOn, setRepeatOn] = useState(false);
  const [repeatDays, setRepeatDays] = useState<number[]>([]);
  const toggleDay = (idx: number) => {
    setRepeatDays(prev => prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx]);
  };

  const repeatRuleFromDays = (): RepeatRule => {
    if (!repeatOn) return "none";
    if (repeatDays.length === 0) return "daily";
    if (repeatDays.length === 5 && !repeatDays.includes(0) && !repeatDays.includes(6)) return "weekdays";
    if (repeatDays.length === 7) return "daily";
    return "weekly";
  };

  const handleSave = () => {
    if (!title.trim()) return;
    const [h, m] = timeStr.split(":").map(Number);
    const due = new Date(`${dateStr}T00:00:00`);
    due.setHours(h, m, 0, 0);
    onSave({ title: title.trim(), dueDate: due, repeat: repeatRuleFromDays() });
  };

  const displayDate = new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric", month: "short",
  });

  const displayTime = (() => {
    const [h, m] = timeStr.split(":").map(Number);
    const isPM = h >= 12;
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(m).padStart(2, "0")} ${isPM ? "PM" : "AM"}`;
  })();

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        background: "rgba(0,0,0,0.55)",
        paddingBottom: 80,
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 430,
          background: HUM_PALETTE.warm,
          borderRadius: 28,
          boxSizing: "border-box",
          maxHeight: "92dvh",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div style={{ padding: "26px 24px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontSize: 40, color: HUM_PALETTE.brown }}>
              New reminder
            </div>
            <div style={{ fontSize: 12, color: HUM_PALETTE.muted, marginTop: 5 }}>
              set it once, steep on it daily
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: "50%",
              background: HUM_PALETTE.cream, border: `0.5px solid ${HUM_PALETTE.blush}`,
              color: HUM_PALETTE.muted, display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 0, flexShrink: 0,
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>


        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: HUM_PALETTE.muted, marginBottom: 7, fontWeight: 500 }}>Title</div>
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Drink a cup of tea"
            style={{
              width: "100%", background: HUM_PALETTE.cream,
              border: `0.5px solid ${HUM_PALETTE.blush}`, borderRadius: 14,
              padding: "12px 14px", fontSize: 15, color: HUM_PALETTE.brown,
              boxSizing: "border-box", outline: "none", fontFamily: "inherit",
            }}
          />
        </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 12, color: HUM_PALETTE.muted, marginBottom: 7, fontWeight: 500 }}>Date</div>
            <button
              onClick={() => setShowCalendar(true)}
              style={{
                width: "100%", background: HUM_PALETTE.cream,
                border: `0.5px solid ${HUM_PALETTE.blush}`, borderRadius: 14,
                padding: "11px 14px", fontSize: 14, color: HUM_PALETTE.brown,
                display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
                boxSizing: "border-box", fontFamily: "inherit",
              }}
            >
              <span style={{ color: HUM_PALETTE.terracotta }}>📅</span>
              {displayDate}
            </button>
          </div>
          <div>
            <div style={{ fontSize: 12, color: HUM_PALETTE.muted, marginBottom: 7, fontWeight: 500 }}>Time</div>
            <button
              onClick={() => setShowTimePicker(true)}
              style={{
                width: "100%", background: HUM_PALETTE.cream,
                border: `0.5px solid ${HUM_PALETTE.blush}`, borderRadius: 14,
                padding: "11px 14px", fontSize: 14, color: HUM_PALETTE.brown,
                display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
                boxSizing: "border-box", fontFamily: "inherit",
              }}
            >
              <span style={{ color: HUM_PALETTE.terracotta }}>🕐</span>
              {displayTime}
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: repeatOn ? 10 : 0 }}>
            <span style={{ fontSize: 12, color: HUM_PALETTE.muted, fontWeight: 500 }}>Repeat</span>
            <button
              onClick={() => setRepeatOn(v => !v)}
              style={{
                width: 38, height: 22, borderRadius: 11,
                background: repeatOn ? HUM_PALETTE.terracotta : HUM_PALETTE.blush,
                border: "none", position: "relative", cursor: "pointer", padding: 0,
                transition: "background 0.2s",
              }}
              aria-label="Toggle repeat"
            >
              <div style={{
                width: 18, height: 18, borderRadius: "50%", background: HUM_PALETTE.warm,
                position: "absolute", top: 2, left: repeatOn ? 18 : 2,
                transition: "left 0.2s",
              }} />
            </button>
          </div>

          {repeatOn && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
                {DAYS.map((d, idx) => (
                  <button
                    key={idx}
                    onClick={() => toggleDay(idx)}
                    style={{
                      aspectRatio: "1", borderRadius: 10,
                      background: repeatDays.includes(idx) ? HUM_PALETTE.terracotta : HUM_PALETTE.cream,
                      border: `0.5px solid ${repeatDays.includes(idx) ? HUM_PALETTE.terracotta : HUM_PALETTE.blush}`,
                      color: repeatDays.includes(idx) ? HUM_PALETTE.warm : HUM_PALETTE.muted,
                      fontSize: 12, fontWeight: repeatDays.includes(idx) ? 600 : 400,
                      cursor: "pointer", padding: 0,
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
              {repeatDays.length === 0 && (
                <div style={{ fontSize: 11, color: HUM_PALETTE.muted, marginTop: 7 }}>
                  No days picked — repeats every day
                </div>
              )}
            </>
          )}
        </div>
        </div>{/* end inner padding */}

        <div style={{ padding: "12px 24px 20px" }}>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            style={{
              width: "100%", background: HUM_PALETTE.terracotta, color: HUM_PALETTE.warm,
              border: "none", borderRadius: 18, padding: 14,
              fontSize: 15, fontWeight: 600, cursor: title.trim() ? "pointer" : "default",
              opacity: title.trim() ? 1 : 0.5, fontFamily: "inherit",
            }}
          >
            Save reminder
          </button>
        </div>
      </div>

      {showTimePicker && (
        <AnalogTimePicker
          value={timeStr}
          onChange={setTimeStr}
          onClose={() => setShowTimePicker(false)}
        />
      )}

      {showCalendar && (
        <CalendarPicker
          value={dateStr}
          onChange={setDateStr}
          onClose={() => setShowCalendar(false)}
        />
      )}
    </div>
  );
}