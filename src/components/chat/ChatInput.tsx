"use client";

import { useState, useRef, useCallback, useEffect, type KeyboardEvent } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import type { Message } from "@/types/message";

interface ChatInputProps {
    conversationId: string;
    recipientName?: string;
    replyTo?: Message | null;
    onClearReply?: () => void;
}

const TYPING_THROTTLE_MS = 500;

// ─── Waveform visualizer ─────────────────────────────────────────────────────
function Waveform({ levels }: { levels: number[] }) {
    return (
        <div className="flex items-center justify-center gap-[2px] h-8">
            {levels.map((level, i) => (
                <div
                    key={i}
                    className="w-[3px] rounded-full bg-red-400 transition-all duration-75"
                    style={{
                        height: `${Math.max(3, level * 28)}px`,
                        opacity: 0.4 + level * 0.6,
                    }}
                />
            ))}
        </div>
    );
}

// ─── ChatInput ───────────────────────────────────────────────────────────────
export default function ChatInput({ conversationId, recipientName, replyTo, onClearReply }: ChatInputProps) {
    const [value, setValue] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lastTypingSentRef = useRef<number>(0);

    const sendMessage = useMutation(api.messages.sendMessage);
    const setTyping = useMutation(api.typing.setTyping);

    // ─── Speech recognition ──────────────────────────────────────────
    const {
        isSupported: speechSupported,
        isListening,
        transcript,
        error: speechError,
        audioLevels,
        startListening,
        stopListening,
        cancelListening,
        clearError: clearSpeechError,
    } = useSpeechRecognition();

    // Append transcript to input as user speaks
    const prevTranscriptRef = useRef("");
    const preListenValueRef = useRef("");

    useEffect(() => {
        if (transcript && transcript !== prevTranscriptRef.current) {
            prevTranscriptRef.current = transcript;
            // While listening, show base text + live transcript
            const base = preListenValueRef.current.trimEnd();
            setValue(base ? `${base} ${transcript}` : transcript);
        }
    }, [transcript]);

    // Capture the value before listening starts
    useEffect(() => {
        if (isListening) {
            preListenValueRef.current = value;
            prevTranscriptRef.current = "";
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isListening]);

    const handleMicClick = () => {
        if (isListening) {
            stopListening();
        } else {
            clearSpeechError();
            startListening();
        }
    };

    const handleCancel = () => {
        cancelListening();
        // Restore value to what it was before listening
        setValue(preListenValueRef.current);
    };

    // ─── Typing / Send ───────────────────────────────────────────────
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
                ...(replyTo ? { replyToId: replyTo.id as Id<"messages"> } : {}),
            });
            onClearReply?.();
        } catch (err) {
            console.error("Failed to send message:", err);
            setValue(trimmed);
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
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            {/* Reply preview bar */}
            {replyTo && (
                <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
                    <div className="w-[3px] h-8 bg-indigo-500 rounded-full flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold text-indigo-400 truncate">Replying to</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{replyTo.content}</p>
                    </div>
                    <button
                        onClick={onClearReply}
                        className="flex-shrink-0 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        aria-label="Cancel reply"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}
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

            {/* Speech error (permission denied, etc.) */}
            {speechError && (
                <div className="flex items-center justify-between gap-2 mb-2 px-3 py-2 bg-amber-900/30 border border-amber-800/40 rounded-xl">
                    <p className="text-xs text-amber-400 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {speechError}
                    </p>
                    <button
                        onClick={clearSpeechError}
                        className="text-amber-500 hover:text-amber-300 transition-colors"
                        aria-label="Dismiss"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            {/* ── Recording bar (replaces the text input while listening) ── */}
            {isListening ? (
                <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2.5">
                    {/* Cancel button */}
                    <button
                        onClick={handleCancel}
                        className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                        aria-label="Cancel recording"
                        title="Cancel recording"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Waveform */}
                    <div className="flex-1 flex items-center gap-3">
                        {/* Red recording dot */}
                        <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
                        <Waveform levels={audioLevels} />
                    </div>

                    {/* Live transcript preview */}
                    {transcript && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[120px] truncate italic flex-shrink-0">{transcript}</p>
                    )}

                    {/* Stop & use button */}
                    <button
                        onClick={stopListening}
                        className="flex-shrink-0 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-full transition-colors flex items-center gap-1.5"
                        aria-label="Stop recording"
                        title="Stop recording and use text"
                    >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <rect x="6" y="6" width="12" height="12" rx="2" />
                        </svg>
                        Done
                    </button>
                </div>
            ) : (
                /* ── Normal input bar ── */
                <div className="flex items-end gap-3 bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => {
                            setValue(e.target.value);
                            if (error) setError(null);
                            if (e.target.value.trim()) notifyTyping();
                        }}
                        onKeyDown={handleKeyDown}
                        onInput={handleInput}
                        placeholder={recipientName ? `Message ${recipientName}…` : "Type a message…"}
                        rows={1}
                        disabled={sending}
                        className="
                            flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                            resize-none outline-none overflow-hidden leading-relaxed py-1
                            max-h-[120px] disabled:opacity-70
                        "
                    />

                    {/* Microphone button */}
                    <button
                        onClick={handleMicClick}
                        disabled={!speechSupported}
                        aria-label={!speechSupported ? "Speech recognition not supported" : "Start voice typing"}
                        title={!speechSupported ? "Speech recognition not supported" : "Start voice typing"}
                        className={`
                            flex-shrink-0 w-8 h-8 flex items-center justify-center
                            rounded-full transition-all
                            ${speechSupported
                                ? "text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
                                : "text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-40"
                            }
                        `}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M19 11a7 7 0 01-14 0M12 1a3 3 0 00-3 3v7a3 3 0 006 0V4a3 3 0 00-3-3z"
                            />
                        </svg>
                    </button>

                    {/* Send button */}
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
            )}

            {!isListening && (
                <p className="text-xs text-gray-400 dark:text-gray-600 mt-1.5 ml-1">
                    Press <kbd className="font-mono bg-gray-200 dark:bg-gray-800 px-1 rounded">Enter</kbd> to send,{" "}
                    <kbd className="font-mono bg-gray-200 dark:bg-gray-800 px-1 rounded">Shift+Enter</kbd> for new line
                </p>
            )}
        </div>
    );
}
