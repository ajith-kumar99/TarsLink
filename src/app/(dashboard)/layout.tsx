"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { RedirectToSignIn } from "@clerk/nextjs";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoaded, isSignedIn } = useUser();
    const upsertUser = useMutation(api.users.upsertUser);

    // Sync Clerk identity → Convex on every mount / login
    useEffect(() => {
        if (!isLoaded || !isSignedIn || !user) return;

        upsertUser({
            clerkId: user.id,
            name: user.fullName ?? user.username ?? "Anonymous",
            email: user.primaryEmailAddress?.emailAddress ?? "",
            imageUrl: user.imageUrl ?? "",
        });
    }, [isLoaded, isSignedIn, user, upsertUser]);

    // Not loaded yet — blank screen (Clerk hydrating)
    if (!isLoaded) return null;

    // Not signed in — redirect to sign-in
    if (!isSignedIn) return <RedirectToSignIn />;

    return <>{children}</>;
}
