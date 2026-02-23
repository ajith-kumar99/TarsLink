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
                        <button onClick={() => setConfirming(false)} className="px-2 py-0.5 text-[10px] font-medium bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors">Cancel</button>
                    </>
                )}
            </div>
        );
    }

    return (
        <button
            onClick={() => setConfirming(true)}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-700/60 text-gray-500 hover:text-red-400 transition-all"
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

// ─── Emoji Picker (shows on hover) ───────────────────────────────────────────
function EmojiPicker({
    messageId,
    isMine,
}: {
    messageId: string;
    isMine: boolean;
}) {
    const toggleReaction = useMutation(api.reactions.toggleReaction);
    const [error, setError] = useState(false);

    const handlePick = async (emoji: string) => {
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
        <div
            className={`
                opacity-0 group-hover:opacity-100
                flex items-center gap-0.5
                bg-gray-800 border border-gray-700 rounded-full
                px-1.5 py-1
                shadow-lg
                transition-opacity duration-150
            `}
        >
            {error ? (
                <span className="text-[10px] text-red-400 px-2">Failed</span>
            ) : (
                ALLOWED_EMOJIS.map((emoji) => (
                    <button
                        key={emoji}
                        onClick={() => handlePick(emoji)}
                        className="
                            w-7 h-7 flex items-center justify-center
                            rounded-full text-sm
                            hover:bg-gray-700 hover:scale-110
                            transition-all duration-100
                        "
                        aria-label={`React with ${emoji}`}
                    >
                        {emoji}
                    </button>
                ))
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
                                : "bg-gray-800/60 border-gray-700 text-gray-400 hover:border-gray-600"
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
}

export default function MessageBubble({
    message,
    isMine,
    showAvatar,
    senderName,
    senderAvatar,
    isRead = false,
    currentUserId,
}: MessageBubbleProps) {
    const isDeleted = !!message.deletedAt;

    return (
        <div className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : "flex-row"} group`}>
            {/* Avatar placeholder */}
            <div className="w-7 h-7 flex-shrink-0">
                {showAvatar && senderAvatar ? (
                    <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-700">
                        <Image src={senderAvatar} alt={senderName ?? "User"} width={28} height={28} className="w-full h-full object-cover" unoptimized />
                    </div>
                ) : null}
            </div>

            {/* Bubble + meta */}
            <div className={`flex flex-col max-w-[72%] ${isMine ? "items-end" : "items-start"}`}>
                {senderName && !isMine && (
                    <span className="text-xs text-gray-500 mb-1 ml-1">{senderName}</span>
                )}

                {isDeleted ? (
                    /* ── Deleted message placeholder ── */
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed border border-dashed ${isMine ? "border-gray-700 text-gray-500 rounded-br-sm" : "border-gray-700 text-gray-500 rounded-bl-sm"}`}>
                        <span className="italic flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                            This message was deleted
                        </span>
                    </div>
                ) : (
                    /* ── Normal message ── */
                    <>
                        <div className={`flex items-center gap-1.5 ${isMine ? "flex-row" : "flex-row-reverse"}`}>
                            {/* Emoji picker — only for received messages */}
                            {!isMine && <EmojiPicker messageId={message.id} isMine={isMine} />}

                            {/* Delete button — only for sender */}
                            {isMine && <DeleteButton messageId={message.id} />}

                            {/* The bubble */}
                            <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${isMine ? "bg-indigo-600 text-white rounded-br-sm" : "bg-gray-800 text-gray-100 rounded-bl-sm"}`}>
                                {message.content}
                            </div>
                        </div>

                        {/* Reaction badges below the bubble */}
                        <ReactionBadges messageId={message.id} currentUserId={currentUserId} />
                    </>
                )}

                {/* Timestamp + read tick row */}
                <div className={`flex items-center gap-1 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity ${isMine ? "flex-row-reverse" : "flex-row"}`}>
                    <span className="text-xs text-gray-600">{formatTimestamp(message.createdAt)}</span>
                    {isMine && !isDeleted && <MessageTicks isRead={isRead} />}
                </div>
            </div>
        </div>
    );
}
