"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import type { Message } from "@/types/message";
import { formatTimestamp } from "@/lib/formatTimestamp";

const ALLOWED_EMOJIS = ["👍", "❤️", "😂", "😮", "😢"];

// ─── WhatsApp-style double-tick SVG ──────────────────────────────────────────
function MessageTicks({ isRead }: { isRead: boolean }) {
    const color = isRead ? "#60a5fa" : "#6b7280";
    return (
        <svg width="16" height="11" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0" aria-label={isRead ? "Read" : "Sent"}>
            <path d="M1 5.5L4 8.5L9.5 2" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5.5 5.5L8.5 8.5L14 2" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

// ─── Delete confirm ──────────────────────────────────────────────────────────
function DeleteButton({ messageId }: { messageId: string }) {
    const [confirming, setConfirming] = useState(false);
    const [error, setError] = useState(false);
    const deleteMessage = useMutation(api.messages.deleteMessage);

    const handleDelete = async () => {
        try {
            await deleteMessage({ messageId: messageId as Id<"messages"> });
            setConfirming(false);
        } catch (err) {
            console.error("Failed to delete message:", err);
            setError(true);
            setTimeout(() => { setError(false); setConfirming(false); }, 2000);
        }
    };

    if (confirming) {
        return (
            <div className="flex items-center gap-1">
                {error ? (
                    <span className="text-[10px] text-red-400 px-2">Failed</span>
                ) : (
                    <>
                        <button onClick={handleDelete} className="px-2 py-0.5 text-[10px] font-medium bg-red-600 hover:bg-red-500 text-white rounded transition-colors">Delete</button>
                        <button onClick={() => setConfirming(false)} className="px-2 py-0.5 text-[10px] font-medium bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded transition-colors">Cancel</button>
                    </>
                )}
            </div>
        );
    }

    return (
        <button
            onClick={() => setConfirming(true)}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200/60 dark:hover:bg-gray-700/60 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-all"
            aria-label="Delete message"
            title="Delete message"
        >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
            </svg>
        </button>
    );
}

// ─── Edit inline ─────────────────────────────────────────────────────────────
function EditButton({ messageId, currentContent, onEditStart }: {
    messageId: string;
    currentContent: string;
    onEditStart: () => void;
}) {
    return (
        <button
            onClick={onEditStart}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200/60 dark:hover:bg-gray-700/60 text-gray-400 dark:text-gray-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-all"
            aria-label="Edit message"
            title="Edit message"
        >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
            </svg>
        </button>
    );
}

function InlineEditor({ messageId, currentContent, onDone }: {
    messageId: string;
    currentContent: string;
    onDone: () => void;
}) {
    const [value, setValue] = useState(currentContent);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const editMessage = useMutation(api.messages.editMessage);

    useEffect(() => {
        inputRef.current?.focus();
        // Move cursor to end
        const len = inputRef.current?.value.length ?? 0;
        inputRef.current?.setSelectionRange(len, len);
    }, []);

    const handleSave = async () => {
        const trimmed = value.trim();
        if (!trimmed || trimmed === currentContent) {
            onDone();
            return;
        }
        try {
            setSaving(true);
            setError(false);
            await editMessage({
                messageId: messageId as Id<"messages">,
                content: trimmed,
            });
            onDone();
        } catch (err) {
            console.error("Failed to edit message:", err);
            setError(true);
            setTimeout(() => setError(false), 2000);
        } finally {
            setSaving(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSave();
        }
        if (e.key === "Escape") {
            onDone();
        }
    };

    return (
        <div className="w-full">
            <textarea
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={saving}
                className="
                    w-full bg-gray-100/80 dark:bg-gray-700/80 text-sm text-gray-900 dark:text-gray-100
                    rounded-xl px-3 py-2 outline-none resize-none
                    focus:ring-1 focus:ring-indigo-500 transition-all
                    max-h-[120px] overflow-y-auto
                    disabled:opacity-60
                "
                style={{ minWidth: "180px" }}
            />
            <div className="flex items-center gap-2 mt-1.5">
                {error && <span className="text-[10px] text-red-400">Failed to save</span>}
                <span className="text-[10px] text-gray-500 flex-1">
                    Esc to cancel · Enter to save
                </span>
                <button
                    onClick={onDone}
                    disabled={saving}
                    className="px-2 py-0.5 text-[10px] font-medium bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving || !value.trim()}
                    className="px-2 py-0.5 text-[10px] font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors disabled:opacity-40"
                >
                    {saving ? "Saving…" : "Save"}
                </button>
            </div>
        </div>
    );
}

// ─── Emoji Picker (click to open) ─────────────────────────────────────────────
function EmojiPicker({
    messageId,
    isMine,
}: {
    messageId: string;
    isMine: boolean;
}) {
    const toggleReaction = useMutation(api.reactions.toggleReaction);
    const [open, setOpen] = useState(false);
    const [error, setError] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handleClick = (e: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [open]);

    const handlePick = async (emoji: string) => {
        setOpen(false);
        try {
            setError(false);
            await toggleReaction({
                messageId: messageId as Id<"messages">,
                emoji,
            });
        } catch (err) {
            console.error("Failed to toggle reaction:", err);
            setError(true);
            setTimeout(() => setError(false), 2000);
        }
    };

    return (
        <div ref={pickerRef} className="relative">
            {/* Trigger button — shows on message hover */}
            <button
                onClick={() => setOpen((v) => !v)}
                className={`
                    opacity-0 group-hover:opacity-100
                    w-7 h-7 flex items-center justify-center
                    rounded-full text-sm
                    bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                    shadow-sm
                    hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-110
                    transition-all duration-150
                    ${open ? "opacity-100 bg-gray-100 dark:bg-gray-700" : ""}
                `}
                aria-label="Add reaction"
                title="React"
            >
                😊
            </button>

            {/* Emoji popover */}
            {open && (
                <div
                    className={`
                        absolute z-50 ${isMine ? "right-0" : "left-0"} bottom-full mb-1.5
                        bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                        rounded-xl shadow-lg dark:shadow-black/40
                        p-1.5
                        animate-[fadeSlideUp_0.15s_ease-out]
                    `}
                >
                    {error ? (
                        <span className="text-[10px] text-red-400 px-2 py-1">Failed</span>
                    ) : (
                        <div className="flex items-center gap-0.5">
                            {ALLOWED_EMOJIS.map((emoji) => (
                                <button
                                    key={emoji}
                                    onClick={() => handlePick(emoji)}
                                    className="
                                        w-8 h-8 flex items-center justify-center
                                        rounded-lg text-lg
                                        hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-125
                                        transition-all duration-100
                                        active:scale-100
                                    "
                                    aria-label={`React with ${emoji}`}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Reaction Badges ─────────────────────────────────────────────────────────
function ReactionBadges({
    messageId,
    currentUserId,
}: {
    messageId: string;
    currentUserId: string;
}) {
    const reactions = useQuery(api.reactions.getReactions, {
        messageId: messageId as Id<"messages">,
    });
    const toggleReaction = useMutation(api.reactions.toggleReaction);

    if (!reactions || reactions.length === 0) return null;

    const handleToggle = async (emoji: string) => {
        try {
            await toggleReaction({
                messageId: messageId as Id<"messages">,
                emoji,
            });
        } catch (err) {
            console.error("Failed to toggle reaction:", err);
        }
    };

    return (
        <div className="flex flex-wrap gap-1 mt-1">
            {reactions.map((group) => {
                const iReacted = group.userIds.includes(currentUserId);
                return (
                    <button
                        key={group.emoji}
                        onClick={() => handleToggle(group.emoji)}
                        className={`
                            inline-flex items-center gap-1
                            px-2 py-0.5 rounded-full text-xs
                            border transition-colors duration-100
                            ${iReacted
                                ? "bg-indigo-600/20 border-indigo-500/40 text-indigo-300"
                                : "bg-gray-100/60 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-600"
                            }
                        `}
                        title={`${group.count} reaction${group.count > 1 ? "s" : ""}`}
                    >
                        <span className="text-sm leading-none">{group.emoji}</span>
                        <span className="font-medium">{group.count}</span>
                    </button>
                );
            })}
        </div>
    );
}

// ─── MessageBubble ───────────────────────────────────────────────────────────
interface MessageBubbleProps {
    message: Message;
    isMine: boolean;
    showAvatar?: boolean;
    senderName?: string;
    senderAvatar?: string;
    isRead?: boolean;
    currentUserId: string;
    onReply?: (message: Message) => void;
    onScrollToMessage?: (messageId: string) => void;
}

export default function MessageBubble({
    message,
    isMine,
    showAvatar,
    senderName,
    senderAvatar,
    isRead = false,
    currentUserId,
    onReply,
    onScrollToMessage,
}: MessageBubbleProps) {
    const isDeleted = !!message.deletedAt;
    const isEdited = !!message.editedAt;
    const [editing, setEditing] = useState(false);

    return (
        <div className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : "flex-row"} group`}>
            {/* Avatar placeholder */}
            <div className="w-7 h-7 flex-shrink-0">
                {showAvatar && senderAvatar ? (
                    <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                        <Image src={senderAvatar} alt={senderName ?? "User"} width={28} height={28} className="w-full h-full object-cover" unoptimized />
                    </div>
                ) : null}
            </div>

            {/* Bubble + meta */}
            <div className={`flex flex-col max-w-[72%] ${isMine ? "items-end" : "items-start"}`}>
                {senderName && !isMine && (
                    <span className="text-xs text-gray-500 dark:text-gray-500 mb-1 ml-1">{senderName}</span>
                )}

                {isDeleted ? (
                    /* ── Deleted message placeholder ── */
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed border border-dashed ${isMine ? "border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-500 rounded-br-sm" : "border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-500 rounded-bl-sm"}`}>
                        <span className="italic flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                            This message was deleted
                        </span>
                    </div>
                ) : editing ? (
                    /* ── Inline edit mode ── */
                    <InlineEditor
                        messageId={message.id}
                        currentContent={message.content}
                        onDone={() => setEditing(false)}
                    />
                ) : (
                    /* ── Normal message ── */
                    <>
                        <div className={`flex items-center gap-1.5 ${isMine ? "flex-row" : "flex-row-reverse"}`}>
                            {/* Emoji picker — only for received messages */}
                            {!isMine && <EmojiPicker messageId={message.id} isMine={isMine} />}

                            {/* Reply button — only for received messages */}
                            {onReply && !isMine && (
                                <button
                                    onClick={() => onReply(message)}
                                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200/60 dark:hover:bg-gray-700/60 text-gray-400 dark:text-gray-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-all"
                                    aria-label="Reply to message"
                                    title="Reply"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                    </svg>
                                </button>
                            )}

                            {/* Edit + Delete buttons — only for sender */}
                            {isMine && (
                                <div className="flex items-center gap-0.5">
                                    <EditButton messageId={message.id} currentContent={message.content} onEditStart={() => setEditing(true)} />
                                    <DeleteButton messageId={message.id} />
                                </div>
                            )}

                            {/* The bubble (with optional reply preview) */}
                            <div className={`rounded-2xl text-sm leading-relaxed break-words ${isMine ? "bg-indigo-600 text-white rounded-br-sm" : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm"}`}>
                                {/* Reply preview quote */}
                                {message.replyPreview && (
                                    <button
                                        onClick={() => message.replyToId && onScrollToMessage?.(message.replyToId)}
                                        className={`
                                            w-full text-left px-3 pt-2.5 pb-1
                                            flex items-stretch gap-2
                                            hover:opacity-80 transition-opacity cursor-pointer
                                        `}
                                    >
                                        <div className={`w-[3px] rounded-full flex-shrink-0 ${isMine ? "bg-indigo-300/50" : "bg-indigo-400/60 dark:bg-indigo-500/60"}`} />
                                        <div className="min-w-0 flex-1">
                                            <p className={`text-[10px] font-semibold truncate ${isMine ? "text-indigo-200" : "text-indigo-500 dark:text-indigo-400"}`}>
                                                {message.replyPreview.senderName}
                                            </p>
                                            <p className={`text-[11px] truncate ${isMine ? "text-indigo-100/60" : "text-gray-500 dark:text-gray-400"}`}>
                                                {message.replyPreview.isDeleted ? "This message was deleted" : message.replyPreview.content}
                                            </p>
                                        </div>
                                    </button>
                                )}

                                {/* Message content */}
                                <div className="px-4 py-2.5">
                                    {message.content}
                                    {isEdited && (
                                        <span className={`text-[10px] ml-1.5 italic ${isMine ? "text-indigo-200/60" : "text-gray-400 dark:text-gray-500"}`}>(edited)</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Reaction badges below the bubble */}
                        <ReactionBadges messageId={message.id} currentUserId={currentUserId} />
                    </>
                )}

                {/* Timestamp + read tick row */}
                <div className={`flex items-center gap-1 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity ${isMine ? "flex-row-reverse" : "flex-row"}`}>
                    <span className="text-xs text-gray-400 dark:text-gray-600">{formatTimestamp(message.createdAt)}</span>
                    {isMine && !isDeleted && <MessageTicks isRead={isRead} />}
                </div>
            </div>
        </div>
    );
}
