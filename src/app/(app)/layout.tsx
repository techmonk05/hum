"use client";
import BottomNav from "@/components/shared/BottomNav";
import PushNotificationProvider from "@/components/shared/PushNotificationProvider";
import RunawayCats from "@/components/shared/RunawayCats";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PushNotificationProvider />
      <RunawayCats />
      {/* Floating decorations — global across all app pages */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <span style={{ position: "absolute", top: "12%", right: "4%", fontSize: 22, animation: "float 4s ease-in-out infinite", display: "inline-block", opacity: 0.4 }}>🐱</span>
        <span style={{ position: "absolute", top: "35%", left: "3%", fontSize: 16, animation: "floatDelay 3.5s ease-in-out infinite 1s", display: "inline-block", opacity: 0.3 }}>🐾</span>
        <span style={{ position: "absolute", top: "60%", right: "5%", fontSize: 18, animation: "float 5s ease-in-out infinite 0.5s", display: "inline-block", opacity: 0.3 }}>🌸</span>
        <span style={{ position: "absolute", top: "75%", left: "4%", fontSize: 14, animation: "floatDelay 4s ease-in-out infinite 2s", display: "inline-block", opacity: 0.3 }}>🐾</span>
        <span style={{ position: "absolute", top: "20%", left: "5%", fontSize: 16, animation: "heartBeat 2.5s ease-in-out infinite", display: "inline-block", opacity: 0.25 }}>🩷</span>
      </div>
      {children}
      <BottomNav />
    </>
  );
}