"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { RedirectToSignIn } from "@clerk/nextjs";
import { usePresenceHeartbeat } from "@/hooks/usePresenceHeartbeat";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoaded, isSignedIn } = useUser();
    const upsertUser = useMutation(api.users.upsertUser);

    // Sync Clerk identity → Convex on every mount / login (also sets initial lastSeen)
    useEffect(() => {
        if (!isLoaded || !isSignedIn || !user) return;

        upsertUser({
            clerkId: user.id,
            name: user.fullName ?? user.username ?? "Anonymous",
            email: user.primaryEmailAddress?.emailAddress ?? "",
            imageUrl: user.imageUrl ?? "",
        });
    }, [isLoaded, isSignedIn, user, upsertUser]);

    // Send presence heartbeat every 20 s while dashboard is mounted
    usePresenceHeartbeat();

    if (!isLoaded) return null;
    if (!isSignedIn) return <RedirectToSignIn />;

    return <>{children}</>;
}
