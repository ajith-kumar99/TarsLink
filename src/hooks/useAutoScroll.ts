"use client";

import { useRef, useState, useCallback, useEffect, useLayoutEffect } from "react";

const NEAR_BOTTOM_PX = 200; // user is "near bottom" if within this many pixels

interface UseAutoScrollResult {
    /** Attach to the scrollable container element */
    containerRef: (node: HTMLDivElement | null) => void;
    /** Attach to an empty <div> at the very bottom of the message list */
    bottomRef: React.RefObject<HTMLDivElement | null>;
    /** True when user has intentionally scrolled away from the bottom */
    isScrolledUp: boolean;
    /** Number of new messages that arrived while user was scrolled up */
    newMessageCount: number;
    /** Programmatically scroll to the bottom and reset the counter */
    scrollToBottom: () => void;
}

/**
 * Smart auto-scroll for chat.
 *
 * ✅ Auto-scrolls when a new message arrives and user is near the bottom.
 * ✅ Always auto-scrolls for the current user's own messages.
 * ✅ Does NOT auto-scroll if the user has scrolled up to read history.
 * ✅ Tracks pending new-message count → powers a "↓ N new messages" FAB.
 * ✅ Instant (no animation) jump on first load.
 */
export function useAutoScroll(
    messageCount: number,
    latestSenderId?: string,
    currentUserId?: string,
): UseAutoScrollResult {
    // Using a callback ref so we re-attach the scroll listener when the DOM node changes
    const [container, setContainer] = useState<HTMLDivElement | null>(null);
    const containerRef = useCallback((node: HTMLDivElement | null) => {
        setContainer(node);
    }, []);

    const bottomRef = useRef<HTMLDivElement | null>(null);
    const [isScrolledUp, setIsScrolledUp] = useState(false);
    const [newMessageCount, setNewMessageCount] = useState(0);

    // Track whether we've done the initial scroll-to-bottom
    const hasScrolledInitially = useRef(false);
    // Track the previous message count to detect new messages
    const prevMessageCount = useRef(0);

    // ── Utility: is the user near the bottom? ────────────────────────
    const isNearBottom = useCallback((): boolean => {
        if (!container) return true;
        const { scrollTop, scrollHeight, clientHeight } = container;
        return scrollHeight - scrollTop - clientHeight <= NEAR_BOTTOM_PX;
    }, [container]);

    // ── Listen for user scroll to track scrolled-up state ────────────
    useEffect(() => {
        if (!container) return;

        let ticking = false;
        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                const nearBottom = isNearBottom();
                setIsScrolledUp(!nearBottom);
                // Clear badge when user scrolls back down
                if (nearBottom) setNewMessageCount(0);
                ticking = false;
            });
        };

        container.addEventListener("scroll", onScroll, { passive: true });
        return () => container.removeEventListener("scroll", onScroll);
    }, [container, isNearBottom]);

    // ── React to message count changes ───────────────────────────────
    useLayoutEffect(() => {
        // Skip when messages haven't loaded yet
        if (messageCount === 0) return;

        const delta = messageCount - prevMessageCount.current;
        prevMessageCount.current = messageCount;

        // ── First load: instant jump to bottom ──
        if (!hasScrolledInitially.current) {
            hasScrolledInitially.current = true;
            // Use double-rAF to ensure DOM has painted
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    bottomRef.current?.scrollIntoView();
                });
            });
            return;
        }

        // No new messages (e.g. conversation switch)
        if (delta <= 0) return;

        const sentByMe =
            !!latestSenderId && !!currentUserId && latestSenderId === currentUserId;

        if (sentByMe || isNearBottom()) {
            // Smooth scroll to bottom
            requestAnimationFrame(() => {
                bottomRef.current?.scrollIntoView({ behavior: "smooth" });
            });
            setNewMessageCount(0);
            setIsScrolledUp(false);
        } else {
            // User is scrolled up — don't force them down
            setNewMessageCount((prev) => prev + delta);
        }
    }, [messageCount, latestSenderId, currentUserId, isNearBottom]);

    // ── Reset state when conversation changes ────────────────────────
    useEffect(() => {
        hasScrolledInitially.current = false;
        prevMessageCount.current = 0;
        setNewMessageCount(0);
        setIsScrolledUp(false);
    }, [currentUserId]); // run once per conversation mount

    // ── Manual scroll-to-bottom ──────────────────────────────────────
    const scrollToBottom = useCallback(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        setIsScrolledUp(false);
        setNewMessageCount(0);
    }, []);

    return {
        containerRef,
        bottomRef,
        isScrolledUp,
        newMessageCount,
        scrollToBottom,
    };
}
