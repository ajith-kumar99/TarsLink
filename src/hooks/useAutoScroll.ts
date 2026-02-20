"use client";

import { useEffect, useRef } from "react";

// useAutoScroll — auto-scrolls to the bottom of a container when new items arrive
// TODO: Implement smart scroll detection and "↓ New messages" button logic

export function useAutoScroll(dep: unknown) {
    const ref = useRef<HTMLDivElement>(null);
    return { ref };
}
