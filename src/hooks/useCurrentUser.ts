"use client";

// useCurrentUser — returns the current logged-in user from Convex
// TODO: Implement using useQuery(api.users.getCurrentUser)

export function useCurrentUser() {
    return { user: null, isLoading: true };
}
