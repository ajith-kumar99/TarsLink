"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface ChatSummaryDialogProps {
    conversationId: string;
    conversationName: string;
    open: boolean;
    onClose: () => void;
}

export default function ChatSummaryDialog({
    conversationId,
    conversationName,
    open,
    onClose,
}: ChatSummaryDialogProps) {
    const [summary, setSummary] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const dialogRef = useRef<HTMLDivElement>(null);

    // Fetch all messages for this conversation
    const messages = useQuery(
        api.messages.getMessages,
        open ? { conversationId: conversationId as Id<"conversations"> } : "skip"
    );

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handleClick = (e: MouseEvent) => {
            if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [open, onClose]);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [open, onClose]);

    // Reset state when dialog opens
    useEffect(() => {
        if (open) {
            setSummary(null);
            setError(null);
        }
    }, [open]);

    const handleSummarize = async () => {
        if (!messages || messages.length === 0) {
            setError("No messages to summarize");
            return;
        }

        setLoading(true);
        setError(null);
        setSummary(null);

        try {
            // Filter to last 30 days and non-deleted messages
            const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
            const recentMessages = messages
                .filter((m) => m.createdAt >= thirtyDaysAgo && !m.deletedAt)
                .map((m) => ({
                    senderName: m.senderName,
                    content: m.content,
                    date: new Date(m.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                    }),
                }));

            if (recentMessages.length === 0) {
                setError("No messages in the last 30 days to summarize");
                setLoading(false);
                return;
            }

            const res = await fetch("/api/summarize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: recentMessages,
                    conversationName,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to generate summary");
            }

            const data = await res.json();
            setSummary(data.summary);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    const messageCount = messages?.filter((m) => !m.deletedAt).length ?? 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div
                ref={dialogRef}
                className="
                    relative w-full max-w-lg mx-4
                    bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800
                    rounded-2xl shadow-2xl
                    flex flex-col max-h-[80vh] overflow-hidden
                    animate-[fadeSlideUp_0.2s_ease-out]
                "
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                                />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white">AI Summary</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{conversationName} · {messageCount} messages</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-5 pb-5">
                    {!summary && !loading && !error && (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                                    />
                                </svg>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-1">
                                Summarize this conversation
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[260px] leading-relaxed mb-5">
                                Uses Gemini AI to create a concise summary of the last 30 days of messages
                            </p>
                            <button
                                onClick={handleSummarize}
                                disabled={!messages || messages.length === 0}
                                className="
                                    inline-flex items-center gap-2 px-5 py-2.5
                                    bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700
                                    text-white text-sm font-medium
                                    rounded-xl shadow-sm
                                    transition-colors duration-150
                                    disabled:opacity-40 disabled:cursor-not-allowed
                                "
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                                    />
                                </svg>
                                Generate Summary
                            </button>
                        </div>
                    )}

                    {loading && (
                        <div className="flex flex-col items-center justify-center py-10">
                            <div className="w-10 h-10 rounded-full border-2 border-indigo-200 dark:border-indigo-800 border-t-indigo-500 animate-spin mb-4" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">Analyzing {messageCount} messages…</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">This may take a few seconds</p>
                        </div>
                    )}

                    {error && (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-3">
                                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <p className="text-sm text-red-600 dark:text-red-400 font-medium mb-1">{error}</p>
                            <button
                                onClick={handleSummarize}
                                className="mt-3 text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                            >
                                Try again
                            </button>
                        </div>
                    )}

                    {summary && (
                        <div className="space-y-3">
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3.5 border border-gray-100 dark:border-gray-800">
                                <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed [&_ul]:space-y-1.5 [&_li]:text-sm">
                                    {summary.split("\n").map((line, i) => (
                                        <p key={i} className={line.trim() === "" ? "h-2" : ""}>{line}</p>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                                <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                                        />
                                    </svg>
                                    Powered by Gemini
                                </span>
                                <button
                                    onClick={handleSummarize}
                                    className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                                >
                                    Regenerate
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
