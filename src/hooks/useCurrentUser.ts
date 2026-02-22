"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

/**
 * useCurrentUser — returns the current user's Convex record.
 * Returns { user, isLoading } — user is null while loading or if not signed in.
 */
export function useCurrentUser() {
    const user = useQuery(api.users.getCurrentUser);
    const isLoading = user === undefined;
    return { user: user ?? null, isLoading };
}
