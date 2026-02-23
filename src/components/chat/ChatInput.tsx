"use client";

import { useState, useRef, useCallback, type KeyboardEvent } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface ChatInputProps {
    conversationId: string;
    recipientName?: string;
}

const TYPING_THROTTLE_MS = 500;

export default function ChatInput({ conversationId, recipientName }: ChatInputProps) {
    const [value, setValue] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lastTypingSentRef = useRef<number>(0);

    const sendMessage = useMutation(api.messages.sendMessage);
    const setTyping = useMutation(api.typing.setTyping);

    const notifyTyping = useCallback(() => {
        const now = Date.now();
        if (now - lastTypingSentRef.current < TYPING_THROTTLE_MS) return;
        lastTypingSentRef.current = now;
        setTyping({ conversationId: conversationId as Id<"conversations"> }).catch(() => { });
    }, [setTyping, conversationId]);

    const handleSend = async () => {
        const trimmed = value.trim();
        if (!trimmed || sending) return;
        setError(null);
        try {
            setSending(true);
            setValue("");
            if (textareaRef.current) textareaRef.current.style.height = "auto";
            await sendMessage({
                conversationId: conversationId as Id<"conversations">,
                content: trimmed,
            });
        } catch (err) {
            console.error("Failed to send message:", err);
            setValue(trimmed); // Restore text so user can retry
            setError("Failed to send. Check your connection and try again.");
        } finally {
            setSending(false);
            textareaRef.current?.focus();
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
            return;
        }
        notifyTyping();
    };

    const handleInput = () => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        textarea.style.height = "auto";
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    };

    return (
        <div className="px-4 py-3 border-t border-gray-800 bg-gray-900">
            {/* Inline error banner */}
            {error && (
                <div className="flex items-center justify-between gap-2 mb-2 px-3 py-2 bg-red-900/30 border border-red-800/40 rounded-xl">
                    <p className="text-xs text-red-400 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {error}
                    </p>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                            onClick={handleSend}
                            className="text-[10px] font-semibold text-red-300 hover:text-white bg-red-800/40 hover:bg-red-700/60 px-2 py-0.5 rounded transition-colors"
                        >
                            Retry
                        </button>
                        <button
                            onClick={() => setError(null)}
                            className="text-red-500 hover:text-red-300 transition-colors"
                            aria-label="Dismiss"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            <div className="flex items-end gap-3 bg-gray-800 rounded-2xl px-4 py-2 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value);
                        if (error) setError(null); // Clear error when user types
                        if (e.target.value.trim()) notifyTyping();
                    }}
                    onKeyDown={handleKeyDown}
                    onInput={handleInput}
                    placeholder={recipientName ? `Message ${recipientName}…` : "Type a message…"}
                    rows={1}
                    disabled={sending}
                    className="
                        flex-1 bg-transparent text-sm text-gray-100 placeholder-gray-500
                        resize-none outline-none overflow-hidden leading-relaxed py-1
                        max-h-[120px] disabled:opacity-70
                    "
                />
                <button
                    onClick={handleSend}
                    disabled={!value.trim() || sending}
                    aria-label="Send message"
                    className="
                        flex-shrink-0 w-8 h-8 flex items-center justify-center
                        rounded-full transition-all
                        bg-indigo-600 hover:bg-indigo-500 text-white
                        disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-indigo-600
                    "
                >
                    {sending ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <svg className="w-4 h-4 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                    )}
                </button>
            </div>
            <p className="text-xs text-gray-600 mt-1.5 ml-1">
                Press <kbd className="font-mono bg-gray-800 px-1 rounded">Enter</kbd> to send,{" "}
                <kbd className="font-mono bg-gray-800 px-1 rounded">Shift+Enter</kbd> for new line
            </p>
        </div>
    );
}
