"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import type { Conversation } from "@/types/conversation";
import ChatInput from "./ChatInput";
import MessageBubble from "./MessageBubble";

interface ChatWindowProps {
    conversation: Conversation | null;
    onBack?: () => void;
    currentUserId: string;
}

function getDisplayName(conv: Conversation, uid: string) {
    if (conv.isGroup && conv.name) return conv.name;
    const other = conv.members.find((m) => m.id !== uid) ?? conv.members[0];
    return other?.name ?? "Unknown";
}
function getDisplayAvatar(conv: Conversation, uid: string) {
    if (conv.isGroup) return `https://api.dicebear.com/7.x/identicon/svg?seed=${conv.id}`;
    const other = conv.members.find((m) => m.id !== uid) ?? conv.members[0];
    return other?.imageUrl ?? "";
}
function isOtherOnline(conv: Conversation, uid: string) {
    if (conv.isGroup) return false;
    return conv.members.find((m) => m.id !== uid)?.isOnline ?? false;
}

// ─── useTypingUsers ───────────────────────────────────────────────────────────
function useTypingUsers(conversationId: string) {
    const [, tick] = useState(0);
    const records = useQuery(api.typing.getTypingUsers, {
        conversationId: conversationId as Id<"conversations">,
    });
    const now = Date.now();
    const active = (records ?? []).filter((r) => r.expiresAt > now);
    useEffect(() => {
        if (!active.length) return;
        const earliest = Math.min(...active.map((r) => r.expiresAt));
        const delay = earliest - Date.now() + 100;
        if (delay <= 0) return;
        const timer = setTimeout(() => tick((n) => n + 1), delay);
        return () => clearTimeout(timer);
    }, [records]); // eslint-disable-line react-hooks/exhaustive-deps
    return active;
}

// ─── MessagesArea ─────────────────────────────────────────────────────────────
function MessagesArea({
    conversationId,
    currentUserId,
    conversationMembers,
    isGroup,
    recipientName,
}: {
    conversationId: string;
    currentUserId: string;
    conversationMembers: Conversation["members"];
    isGroup: boolean;
    recipientName: string;
}) {
    const bottomRef = useRef<HTMLDivElement>(null);
    const markRead = useMutation(api.readReceipts.markConversationRead);

    const messages = useQuery(api.messages.getMessages, {
        conversationId: conversationId as Id<"conversations">,
    });

    // Read status: myLastReadAt for divider, otherLastReadAt for tick colors
    const readStatus = useQuery(api.readReceipts.getConversationReadStatus, {
        conversationId: conversationId as Id<"conversations">,
    });

    /**
     * Capture the initial myLastReadAt BEFORE we mark as read.
     * This is what we use to place the "Unread messages" divider.
     * We freeze it in a ref so it doesn't update after marking read.
     */
    const initialReadAtRef = useRef<number | null>(null);
    useEffect(() => {
        if (readStatus !== undefined && initialReadAtRef.current === null) {
            initialReadAtRef.current = readStatus.myLastReadAt;
        }
    }, [readStatus]);

    const typingUsers = useTypingUsers(conversationId);

    // Mark read when conversation opens + on each new incoming message
    const markReadStable = useCallback(() => {
        markRead({ conversationId: conversationId as Id<"conversations"> }).catch(() => { });
    }, [markRead, conversationId]);

    useEffect(() => {
        markReadStable();
    }, [markReadStable, messages?.length]);

    // Auto-scroll on new messages / typing
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages?.length, typingUsers.length]);

    if (messages === undefined || readStatus === undefined) {
        return (
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                        <div className={`h-8 rounded-2xl animate-pulse bg-gray-800 ${i % 2 === 0 ? "w-40" : "w-56"}`} />
                    </div>
                ))}
            </div>
        );
    }

    const frozenReadAt = initialReadAtRef.current ?? 0;
    const otherLastReadAt = readStatus.otherLastReadAt;

    // Count unread messages to show in divider label
    const unreadMessages = messages.filter(
        (m) => String(m.senderId) !== currentUserId && m.createdAt > frozenReadAt
    );
    const dividerCount = unreadMessages.length;

    // Index of the first unread message (from others)
    const firstUnreadIndex =
        dividerCount > 0
            ? messages.findIndex(
                (m) => String(m.senderId) !== currentUserId && m.createdAt > frozenReadAt
            )
            : -1;

    return (
        <>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="text-5xl mb-3">👋</div>
                        <p className="text-gray-400 text-sm">No messages yet</p>
                        <p className="text-gray-600 text-xs mt-1">Say hello to {recipientName}!</p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isMine = String(msg.senderId) === currentUserId;
                        const prevMsg = index > 0 ? messages[index - 1] : null;
                        const showAvatar = !isMine && (!prevMsg || prevMsg.senderId !== msg.senderId);
                        const sender = conversationMembers.find((m) => m.id === msg.senderId);
                        const isRead = isMine && otherLastReadAt >= msg.createdAt;

                        return (
                            <div key={msg._id as string}>
                                {/* ── Unread messages divider ───────────────── */}
                                {index === firstUnreadIndex && dividerCount > 0 && (
                                    <div className="flex items-center gap-3 my-4">
                                        <div className="flex-1 h-px bg-indigo-500/30" />
                                        <span className="text-xs font-medium text-indigo-400 bg-indigo-500/10 px-3 py-0.5 rounded-full whitespace-nowrap">
                                            {dividerCount} unread message{dividerCount > 1 ? "s" : ""}
                                        </span>
                                        <div className="flex-1 h-px bg-indigo-500/30" />
                                    </div>
                                )}

                                <MessageBubble
                                    message={{
                                        id: msg._id as string,
                                        senderId: msg.senderId as string,
                                        content: msg.content,
                                        createdAt: msg.createdAt,
                                    }}
                                    isMine={isMine}
                                    showAvatar={showAvatar}
                                    senderName={isGroup ? (sender?.name ?? msg.senderName) : undefined}
                                    senderAvatar={showAvatar ? (sender?.imageUrl ?? msg.senderImage) : undefined}
                                    isRead={isRead}
                                />
                            </div>
                        );
                    })
                )}

                {/* Typing indicator */}
                {typingUsers.length > 0 && (
                    <div className="flex items-end gap-2">
                        <div className="w-7 h-7 flex-shrink-0" />
                        <div className="flex flex-col items-start">
                            <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                            </div>
                            <span className="text-xs text-gray-600 mt-1 ml-1">
                                {typingUsers.length === 1
                                    ? `${typingUsers[0].userName} is typing…`
                                    : `${typingUsers.map((u) => u.userName).join(", ")} are typing…`}
                            </span>
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            <ChatInput conversationId={conversationId} recipientName={recipientName} />
        </>
    );
}

// ─── ChatWindow ───────────────────────────────────────────────────────────────
export default function ChatWindow({ conversation, onBack, currentUserId }: ChatWindowProps) {
    if (!conversation) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-950 text-center px-6">
                <div className="text-6xl mb-4">💬</div>
                <h2 className="text-xl font-semibold text-white mb-2">Your Messages</h2>
                <p className="text-gray-400 text-sm max-w-xs">
                    Select a conversation or find a user in the{" "}
                    <span className="text-indigo-400 font-medium">People</span> tab.
                </p>
            </div>
        );
    }

    const name = getDisplayName(conversation, currentUserId);
    const avatar = getDisplayAvatar(conversation, currentUserId);
    const online = isOtherOnline(conversation, currentUserId);

    return (
        <div className="flex flex-col h-full bg-gray-950">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-900">
                {onBack && (
                    <button onClick={onBack} className="md:hidden text-gray-400 hover:text-white p-1 -ml-1 mr-1" aria-label="Go back">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                )}
                <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-700">
                        <Image src={avatar} alt={name} width={36} height={36} className="w-full h-full object-cover" unoptimized />
                    </div>
                    {online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-gray-900" />}
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-semibold text-white truncate">{name}</h2>
                    <p className={`text-xs ${online ? "text-emerald-400" : "text-gray-500"}`}>
                        {conversation.isGroup ? `${conversation.members.length} members` : online ? "Online" : "Offline"}
                    </p>
                </div>
            </div>

            <MessagesArea
                conversationId={conversation.id}
                currentUserId={currentUserId}
                conversationMembers={conversation.members}
                isGroup={conversation.isGroup}
                recipientName={name}
            />
        </div>
    );
}
