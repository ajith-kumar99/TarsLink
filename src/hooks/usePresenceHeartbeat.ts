"use client";

import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

const HEARTBEAT_INTERVAL_MS = 20_000; // 20 seconds

/**
 * Sends a presence heartbeat to Convex every 20 seconds.
 * A user is considered online if lastSeen < 30 seconds ago.
 *
 * Call this hook once at the top of the dashboard layout.
 */
export function usePresenceHeartbeat() {
    const updatePresence = useMutation(api.users.updatePresence);

    useEffect(() => {
        // Fire immediately on mount
        updatePresence().catch(() => { });

        const interval = setInterval(() => {
            updatePresence().catch(() => { });
        }, HEARTBEAT_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [updatePresence]);
}
