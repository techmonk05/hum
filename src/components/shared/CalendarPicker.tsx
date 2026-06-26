"use client";
import { useState } from "react";
import { HUM_PALETTE } from "@/lib/constants";

interface CalendarPickerProps {
  value: string; // "YYYY-MM-DD"
  onChange: (value: string) => void;
  onClose: () => void;
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

export default function CalendarPicker({ value, onChange, onClose }: CalendarPickerProps) {
  const selected = value ? new Date(`${value}T00:00:00`) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [view, setView] = useState(() => {
    const d = selected ?? new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const firstDay = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1
  );
  // pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => setView(v =>
    v.month === 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: v.month - 1 }
  );
  const nextMonth = () => setView(v =>
    v.month === 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: v.month + 1 }
  );

  const select = (day: number) => {
    const mm = String(view.month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    onChange(`${view.year}-${mm}-${dd}`);
    onClose();
  };

  const isSelected = (day: number) =>
    selected?.getFullYear() === view.year &&
    selected?.getMonth() === view.month &&
    selected?.getDate() === day;

  const isToday = (day: number) =>
    today.getFullYear() === view.year &&
    today.getMonth() === view.month &&
    today.getDate() === day;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1100,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.6)",
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 320, background: "#1A1118",
          borderRadius: 24, overflow: "hidden",
          border: `1px solid #2D1F2A`,
          boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div style={{
          background: HUM_PALETTE.terracotta,
          padding: "20px 20px 16px",
        }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 4,
          }}>
            <button onClick={prevMonth} style={{
              background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%",
              width: 30, height: 30, cursor: "pointer", color: HUM_PALETTE.warm,
              fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
            }}>‹</button>

            <div style={{ textAlign: "center" }}>
              <div style={{
                fontFamily: "'Playfair Display', serif", fontStyle: "italic",
                fontSize: 22, color: HUM_PALETTE.warm, fontWeight: 700, letterSpacing: -0.3,
              }}>
                {MONTHS[view.month]}
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 500, marginTop: 1 }}>
                {view.year}
              </div>
            </div>

            <button onClick={nextMonth} style={{
              background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%",
              width: 30, height: 30, cursor: "pointer", color: HUM_PALETTE.warm,
              fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
            }}>›</button>
          </div>
        </div>

        {/* Day labels */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
          padding: "14px 16px 6px",
          gap: 2,
        }}>
          {DAYS.map(d => (
            <div key={d} style={{
              textAlign: "center", fontSize: 11, fontWeight: 700,
              color: HUM_PALETTE.muted, letterSpacing: 0.5,
              paddingBottom: 6,
            }}>
              {d}
            </div>
          ))}
        </div>

        {/* Date grid */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
          padding: "0 16px 20px",
          gap: 4,
        }}>
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;
            const sel = isSelected(day);
            const tod = isToday(day);
            return (
              <button
                key={i}
                onClick={() => select(day)}
                style={{
                  aspectRatio: "1",
                  borderRadius: "50%",
                  border: tod && !sel ? `1.5px solid ${HUM_PALETTE.terracotta}` : "none",
                  background: sel ? HUM_PALETTE.terracotta : "transparent",
                  color: sel ? HUM_PALETTE.warm : tod ? HUM_PALETTE.terracotta : HUM_PALETTE.brown,
                  fontSize: 13,
                  fontWeight: sel || tod ? 700 : 400,
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.15s",
                  fontFamily: "inherit",
                }}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "12px 20px 18px",
          borderTop: "1px solid #2D1F2A",
        }}>
          <button
            onClick={() => {
              const t = new Date();
              const mm = String(t.getMonth() + 1).padStart(2, "0");
              const dd = String(t.getDate()).padStart(2, "0");
              onChange(`${t.getFullYear()}-${mm}-${dd}`);
              onClose();
            }}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: HUM_PALETTE.terracotta, fontSize: 13, fontWeight: 600,
              fontFamily: "inherit",
            }}
          >
            Today
          </button>
          <button
            onClick={onClose}
            style={{
              background: "#2D1F2A", border: "none", borderRadius: 12,
              padding: "8px 18px", cursor: "pointer",
              color: HUM_PALETTE.muted, fontSize: 13, fontWeight: 600,
              fontFamily: "inherit",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
