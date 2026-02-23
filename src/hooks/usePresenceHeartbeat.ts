"use client";

import { useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

const HEARTBEAT_INTERVAL_MS = 10_000;       // heartbeat every 10 s
const VISIBILITY_OFFLINE_DELAY_MS = 5_000;  // wait 5 s after tab hidden before marking offline

/**
 * Presence heartbeat + instant offline detection.
 *
 * 1. Heartbeat every 10 s → updatePresence (sets lastSeen = now)
 * 2. Tab close (beforeunload) → setOffline INSTANTLY
 * 3. Tab hidden (visibilitychange) → setOffline after 5 s delay
 * 4. Tab visible again → updatePresence immediately (cancels pending offline)
 */
export function usePresenceHeartbeat() {
    const updatePresence = useMutation(api.users.updatePresence);
    const setOffline = useMutation(api.users.setOffline);
    const visibilityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        // ── Heartbeat ────────────────────────────────────────────────
        updatePresence().catch(() => { });
        const heartbeat = setInterval(() => {
            updatePresence().catch(() => { });
        }, HEARTBEAT_INTERVAL_MS);

        // ── Tab close → INSTANT offline ──────────────────────────────
        const handleBeforeUnload = () => {
            // Fire-and-forget — the WebSocket message usually gets sent
            // before the page actually unloads
            setOffline().catch(() => { });
        };

        // ── Tab hidden / visible ─────────────────────────────────────
        const handleVisibilityChange = () => {
            if (document.visibilityState === "hidden") {
                // Start a 5 s timer — if user comes back before 5 s, cancel it
                visibilityTimerRef.current = setTimeout(() => {
                    setOffline().catch(() => { });
                }, VISIBILITY_OFFLINE_DELAY_MS);
            } else {
                // Tab visible again — cancel pending offline, send heartbeat
                if (visibilityTimerRef.current) {
                    clearTimeout(visibilityTimerRef.current);
                    visibilityTimerRef.current = null;
                }
                updatePresence().catch(() => { });
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            clearInterval(heartbeat);
            window.removeEventListener("beforeunload", handleBeforeUnload);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            if (visibilityTimerRef.current) {
                clearTimeout(visibilityTimerRef.current);
            }
        };
    }, [updatePresence, setOffline]);
}
