"use client";

import { ClerkProvider as BaseClerkProvider } from "@clerk/nextjs";

export default function ClerkProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    return <BaseClerkProvider>{children}</BaseClerkProvider>;
}
