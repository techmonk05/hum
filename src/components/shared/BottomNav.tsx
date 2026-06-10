// src/components/shared/BottomNav.tsx
"use client";
import { usePathname, useRouter } from "next/navigation";
import { HUM_PALETTE } from "@/lib/constants";

const NAV_ITEMS = [
  { id: "home",     href: "/home",     icon: "🏠", label: "Home" },
  { id: "corner",   href: "/corner",   icon: "💌", label: "Our Corner" },
  { id: "reminders",href: "/reminders",icon: "🔔", label: "Reminders" },
  { id: "profile",  href: "/profile",  icon: "🫶", label: "Us" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router   = useRouter();

  return (
    <nav style={{
      position: "fixed", bottom: 0, left: "50%",
      transform: "translateX(-50%)",
      width: "100%", maxWidth: 430,
      background: "rgba(255,252,248,0.92)",
      backdropFilter: "blur(16px)",
      borderTop: `1px solid ${HUM_PALETTE.blush}`,
      display: "flex", justifyContent: "space-around", alignItems: "center",
      padding: "12px 0 20px",
      zIndex: 100,
      paddingBottom: "max(20px, env(safe-area-inset-bottom))",
    }}>
      {NAV_ITEMS.map(n => {
        const active = pathname.startsWith(n.href);
        return (
          <button
            key={n.id}
            onClick={() => router.push(n.href)}
            style={{
              display: "flex", flexDirection: "column",
              alignItems: "center", gap: 4,
              padding: "4px 16px", borderRadius: 16,
              border: "none", cursor: "pointer",
              background: active ? HUM_PALETTE.blush : "transparent",
              transition: "all 0.2s",
            }}
          >
            <span style={{ fontSize: 22, lineHeight: 1 }}>{n.icon}</span>
            <span style={{
              fontSize: 10, fontWeight: 700,
              color: active ? HUM_PALETTE.terracotta : HUM_PALETTE.muted,
              fontFamily: "inherit",
            }}>
              {n.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
