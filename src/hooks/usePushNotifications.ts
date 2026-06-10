// src/hooks/usePushNotifications.ts
"use client";
import { useEffect } from "react";

export default function usePushNotifications() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");

        const existing = await reg.pushManager.getSubscription();
        if (existing) return; // already subscribed

        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly:      true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        });

        const json = sub.toJSON();
        await fetch("/api/push/subscribe", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            endpoint: json.endpoint,
            keys:     json.keys,
          }),
        });
      } catch (e) {
        console.error("Push registration failed:", e);
      }
    };

    register();
  }, []);
}