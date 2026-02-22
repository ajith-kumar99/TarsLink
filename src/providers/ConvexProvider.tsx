"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { ReactNode } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function ConvexWithClerk({ children }: { children: ReactNode }) {
    return (
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
            {children}
        </ConvexProviderWithClerk>
    );
}

export default function Providers({ children }: { children: ReactNode }) {
    return (
        <ClerkProvider
            appearance={{
                variables: {
                    colorPrimary: "#6366f1",       // indigo-500
                    colorBackground: "#111827",    // gray-900
                    colorInputBackground: "#1f2937", // gray-800
                    colorInputText: "#f9fafb",     // gray-50
                    colorText: "#f9fafb",
                    colorTextSecondary: "#9ca3af", // gray-400
                    borderRadius: "0.75rem",
                },
            }}
        >
            <ConvexWithClerk>{children}</ConvexWithClerk>
        </ClerkProvider>
    );
}
