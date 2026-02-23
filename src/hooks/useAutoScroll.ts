"use client";

import { useRef, useState, useCallback, useEffect } from "react";

const NEAR_BOTTOM_THRESHOLD = 150; // px from bottom to consider "near bottom"

interface AutoScrollReturn {
    /** Attach to the scrollable container */
    containerRef: React.RefObject<HTMLDivElement | null>;
    /** Attach to a sentinel <div> at the very bottom of the list */
    bottomRef: React.RefObject<HTMLDivElement | null>;
    /** true when the user has scrolled up away from the bottom */
    isScrolledUp: boolean;
    /** Number of new messages that arrived while scrolled up */
    newMessageCount: number;
    /** Call to smoothly scroll to the bottom and reset counts */
    scrollToBottom: () => void;
}

/**
 * Smart auto-scroll hook for chat UIs.
 *
 * - Auto-scrolls when a new message arrives IF the user is near the bottom.
 * - Does NOT force-scroll if the user has intentionally scrolled up.
 * - Tracks how many messages arrived while scrolled up → "New Messages ↓" badge.
 * - Always auto-scrolls for messages the current user sends.
 */
export function useAutoScroll(
    messageCount: number,
    latestSenderId?: string,
    currentUserId?: string,
): AutoScrollReturn {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const [isScrolledUp, setIsScrolledUp] = useState(false);
    const [newMessageCount, setNewMessageCount] = useState(0);
    const prevCountRef = useRef(messageCount);
    const isInitialMount = useRef(true);

    // ── Check if user is near the bottom ─────────────────────────────
    const checkNearBottom = useCallback((): boolean => {
        const el = containerRef.current;
        if (!el) return true;
        const { scrollTop, scrollHeight, clientHeight } = el;
        return scrollHeight - scrollTop - clientHeight < NEAR_BOTTOM_THRESHOLD;
    }, []);

    // ── Scroll handler — track if user scrolled up ───────────────────
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const handleScroll = () => {
            const nearBottom = checkNearBottom();
            setIsScrolledUp(!nearBottom);
            if (nearBottom) {
                setNewMessageCount(0);
            }
        };

        el.addEventListener("scroll", handleScroll, { passive: true });
        return () => el.removeEventListener("scroll", handleScroll);
    }, [checkNearBottom]);

    // ── React to new messages ────────────────────────────────────────
    useEffect(() => {
        const newMessages = messageCount - prevCountRef.current;
        prevCountRef.current = messageCount;

        if (newMessages <= 0) return;

        // Always scroll on initial load
        if (isInitialMount.current) {
            isInitialMount.current = false;
            requestAnimationFrame(() => {
                bottomRef.current?.scrollIntoView();
            });
            return;
        }

        const isMine = latestSenderId && currentUserId && latestSenderId === currentUserId;
        const nearBottom = checkNearBottom();

        if (nearBottom || isMine) {
            // Auto-scroll smoothly
            requestAnimationFrame(() => {
                bottomRef.current?.scrollIntoView({ behavior: "smooth" });
            });
            setNewMessageCount(0);
        } else {
            // User is scrolled up — accumulate badge count
            setNewMessageCount((prev) => prev + newMessages);
        }
    }, [messageCount, latestSenderId, currentUserId, checkNearBottom]);

    // ── Manual scroll-to-bottom (for the "New Messages ↓" button) ───
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
