// src/components/shared/AnalogTimePicker.tsx
"use client";
import { useRef, useState, useEffect, useCallback } from "react";
import { HUM_PALETTE } from "@/lib/constants";

interface AnalogTimePickerProps {
  value: string;            // "HH:MM" 24-hour, e.g. "09:00"
  onChange: (value: string) => void;
  onClose: () => void;
}

const CLOCK_SIZE   = 220;
const CENTER       = CLOCK_SIZE / 2;
const HAND_LENGTH  = 68;
const NUMERAL_R    = 84;

function angleForHour(hour12: number) {
  // 12 at top = 0deg, clockwise. hour12 in 1..12
  return ((hour12 % 12) / 12) * 360;
}

function pointFromAngle(deg: number, radius: number) {
  const rad = (deg - 90) * (Math.PI / 180);
  return {
    x: CENTER + radius * Math.cos(rad),
    y: CENTER + radius * Math.sin(rad),
  };
}

export default function AnalogTimePicker({ value, onChange, onClose }: AnalogTimePickerProps) {
  const [hour24, minute] = value.split(":").map(Number);
  const isPM = hour24 >= 12;
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

  const [mode, setMode]   = useState<"hour" | "minute">("hour");
  const [dragging, setDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const setFromAngle = useCallback((deg: number) => {
    if (mode === "hour") {
      let h = Math.round(deg / 30) % 12; // 30deg per hour
      if (h === 0) h = 12;
      const newHour24 = isPM ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h);
      onChange(`${String(newHour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
    } else {
      let m = Math.round(deg / 6) % 60; // 6deg per minute
      m = Math.round(m / 5) * 5; // snap to nearest 5
      if (m === 60) m = 0;
      onChange(`${String(hour24).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }, [mode, isPM, minute, hour24, onChange]);

  const handlePointer = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scale = CLOCK_SIZE / rect.width;
    const x = (clientX - rect.left) * scale - CENTER;
    const y = (clientY - rect.top) * scale - CENTER;
    let deg = Math.atan2(x, -y) * (180 / Math.PI);
    if (deg < 0) deg += 360;
    setFromAngle(deg);
  }, [setFromAngle]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent | TouchEvent) => {
      const point = "touches" in e ? e.touches[0] : e;
      if (point) handlePointer(point.clientX, point.clientY);
    };
    const onUp = () => setDragging(false);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [dragging, handlePointer]);

  const handAngle = mode === "hour" ? angleForHour(hour12) : minute * 6;
  const handTip   = pointFromAngle(handAngle, HAND_LENGTH);

  const displayHour   = String(hour12).padStart(2, "0");
  const displayMinute = String(minute).padStart(2, "0");

  const togglePM = (pm: boolean) => {
    let h = hour12;
    const newHour24 = pm ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h);
    onChange(`${String(newHour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1100,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      background: "rgba(0,0,0,0.55)",
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 430,
          background: HUM_PALETTE.warm,
          borderRadius: "28px 28px 0 0",
          padding: "26px 24px 30px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontSize: 20, color: HUM_PALETTE.brown }}>
            Set time
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: "50%",
              background: HUM_PALETTE.cream, border: `0.5px solid ${HUM_PALETTE.blush}`,
              color: HUM_PALETTE.muted, display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 0,
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* digital readout */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 24 }}>
          <button
            onClick={() => setMode("hour")}
            style={{
              background: HUM_PALETTE.cream,
              border: `0.5px solid ${mode === "hour" ? HUM_PALETTE.terracotta : HUM_PALETTE.blush}`,
              borderRadius: 14, padding: "10px 18px",
              fontSize: 26, fontWeight: 500,
              color: mode === "hour" ? HUM_PALETTE.terracotta : HUM_PALETTE.brown,
              fontFamily: "'Playfair Display', serif",
              cursor: "pointer", minWidth: 56, textAlign: "center",
            }}
          >
            {displayHour}
          </button>
          <div style={{ fontSize: 22, color: HUM_PALETTE.muted }}>:</div>
          <button
            onClick={() => setMode("minute")}
            style={{
              background: HUM_PALETTE.cream,
              border: `0.5px solid ${mode === "minute" ? HUM_PALETTE.terracotta : HUM_PALETTE.blush}`,
              borderRadius: 14, padding: "10px 18px",
              fontSize: 26, fontWeight: 500,
              color: mode === "minute" ? HUM_PALETTE.terracotta : HUM_PALETTE.brown,
              fontFamily: "'Playfair Display', serif",
              cursor: "pointer", minWidth: 56, textAlign: "center",
            }}
          >
            {displayMinute}
          </button>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginLeft: 6 }}>
            <button
              onClick={() => togglePM(false)}
              style={{
                background: !isPM ? HUM_PALETTE.terracotta : HUM_PALETTE.cream,
                color: !isPM ? HUM_PALETTE.warm : HUM_PALETTE.muted,
                border: !isPM ? "none" : `0.5px solid ${HUM_PALETTE.blush}`,
                borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer",
              }}
            >
              AM
            </button>
            <button
              onClick={() => togglePM(true)}
              style={{
                background: isPM ? HUM_PALETTE.terracotta : HUM_PALETTE.cream,
                color: isPM ? HUM_PALETTE.warm : HUM_PALETTE.muted,
                border: isPM ? "none" : `0.5px solid ${HUM_PALETTE.blush}`,
                borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer",
              }}
            >
              PM
            </button>
          </div>
        </div>

        {/* analog clock face */}
        <svg
          ref={svgRef}
          width={CLOCK_SIZE} height={CLOCK_SIZE} viewBox={`0 0 ${CLOCK_SIZE} ${CLOCK_SIZE}`}
          style={{ display: "block", margin: "0 auto 20px", touchAction: "none", userSelect: "none" }}
          onMouseDown={e => { setDragging(true); handlePointer(e.clientX, e.clientY); }}
          onTouchStart={e => { setDragging(true); handlePointer(e.touches[0].clientX, e.touches[0].clientY); }}
        >
          <circle cx={CENTER} cy={CENTER} r={100} fill={HUM_PALETTE.cream} stroke={HUM_PALETTE.blush} strokeWidth={1} />

          {mode === "hour"
            ? Array.from({ length: 12 }, (_, i) => {
                const h = i === 0 ? 12 : i;
                const { x, y } = pointFromAngle(angleForHour(h), NUMERAL_R);
                return (
                  <text key={h} x={x} y={y + 5} textAnchor="middle"
                    fontSize={h === 12 || h === 3 || h === 6 || h === 9 ? 15 : 12}
                    fill={h === 12 || h === 3 || h === 6 || h === 9 ? HUM_PALETTE.brown : HUM_PALETTE.muted}
                    style={{ pointerEvents: "none" }}
                  >
                    {h}
                  </text>
                );
              })
            : Array.from({ length: 12 }, (_, i) => {
                const m = i * 5;
                const { x, y } = pointFromAngle(m * 6, NUMERAL_R);
                return (
                  <text key={m} x={x} y={y + 5} textAnchor="middle"
                    fontSize={m % 15 === 0 ? 15 : 12}
                    fill={m % 15 === 0 ? HUM_PALETTE.brown : HUM_PALETTE.muted}
                    style={{ pointerEvents: "none" }}
                  >
                    {String(m).padStart(2, "0")}
                  </text>
                );
              })
          }

          <line x1={CENTER} y1={CENTER} x2={handTip.x} y2={handTip.y}
            stroke={HUM_PALETTE.terracotta} strokeWidth={3} strokeLinecap="round" />
          <circle cx={handTip.x} cy={handTip.y} r={16} fill={HUM_PALETTE.terracotta} opacity={0.92} />
          <circle cx={CENTER} cy={CENTER} r={5} fill={HUM_PALETTE.terracotta} />
        </svg>

        <div style={{ textAlign: "center", fontSize: 11, color: HUM_PALETTE.muted, marginBottom: 22 }}>
          {mode === "hour" ? "Drag to set the hour, then tap the minutes" : "Drag to set the minutes"}
        </div>

        <button
          onClick={onClose}
          style={{
            width: "100%", background: HUM_PALETTE.terracotta, color: HUM_PALETTE.warm,
            border: "none", borderRadius: 18, padding: 15,
            fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          }}
        >
          Set time
        </button>
      </div>
    </div>
  );
}