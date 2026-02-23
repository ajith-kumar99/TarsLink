"use client";

import { useState, useEffect } from "react";

const ONLINE_THRESHOLD_MS = 15_000; // 15 seconds (tighter with 10s heartbeat)
const TICK_INTERVAL_MS = 5_000;     // re-render every 5 seconds

/**
 * Returns the current timestamp, updating every 5 seconds.
 * Forces a re-render so computed values always reflect real time.
 */
export function useNow(intervalMs = TICK_INTERVAL_MS): number {
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), intervalMs);
        return () => clearInterval(id);
    }, [intervalMs]);
    return now;
}

/**
 * Returns true if `lastSeen` is within 15 seconds of the current time.
 * Rechecks every 5 seconds via useNow().
 */
export function useIsOnline(lastSeen: number | undefined): boolean {
    const now = useNow();
    if (!lastSeen) return false;
    return now - lastSeen < ONLINE_THRESHOLD_MS;
}

/**
 * Pure function for computing online status without a hook.
 */
export function isOnlineAt(lastSeen: number | undefined, now: number): boolean {
    if (!lastSeen) return false;
    return now - lastSeen < ONLINE_THRESHOLD_MS;
}
