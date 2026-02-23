"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import type { Conversation } from "@/types/conversation";
import { useIsOnline } from "@/hooks/useIsOnline";
import { useAutoScroll } from "@/hooks/useAutoScroll";
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
function getOtherLastSeen(conv: Conversation, uid: string): number | undefined {
    if (conv.isGroup) return undefined;
    return conv.members.find((m) => m.id !== uid)?.lastSeen;
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

// ─── Loading skeleton for messages ────────────────────────────────────────────
function MessagesSkeleton() {
    return (
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
            {[
                { align: "start", w: "w-48" },
                { align: "start", w: "w-64" },
                { align: "end", w: "w-40" },
                { align: "start", w: "w-56" },
                { align: "end", w: "w-52" },
                { align: "end", w: "w-36" },
            ].map((row, i) => (
                <div key={i} className={`flex ${row.align === "end" ? "justify-end" : "justify-start"}`}>
                    <div className={`flex items-end gap-2 ${row.align === "end" ? "flex-row-reverse" : ""}`}>
                        {row.align === "start" && (
                            <div className="w-7 h-7 rounded-full bg-gray-800/60 animate-pulse flex-shrink-0" />
                        )}
                        <div className={`h-10 rounded-2xl animate-pulse ${row.w} ${row.align === "end" ? "bg-indigo-900/30" : "bg-gray-800/60"}`} />
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Empty states ─────────────────────────────────────────────────────────────
function NoMessagesPlaceholder({ recipientName }: { recipientName: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                </svg>
            </div>
            <p className="text-gray-300 text-sm font-medium mb-1">No messages yet</p>
            <p className="text-gray-500 text-xs max-w-[200px]">
                Say hello to <span className="text-indigo-400">{recipientName}</span> and start your conversation!
            </p>
        </div>
    );
}

function NoConversationPlaceholder() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-950 text-center px-6">
            <div className="w-20 h-20 rounded-2xl bg-gray-800/40 flex items-center justify-center mb-5">
                <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                </svg>
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">Your Messages</h2>
            <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
                Select a conversation from the sidebar or discover users in the{" "}
                <span className="text-indigo-400 font-medium">People</span> tab to get started.
            </p>
        </div>
    );
}

// ─── New Messages FAB ─────────────────────────────────────────────────────────
function NewMessagesFab({ count, onClick }: { count: number; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="
                absolute bottom-20 left-1/2 -translate-x-1/2 z-10
                flex items-center gap-2 px-4 py-2
                bg-indigo-600 hover:bg-indigo-500
                text-white text-xs font-medium
                rounded-full shadow-lg shadow-indigo-900/40
                transition-all duration-200
                animate-[slideUp_0.2s_ease-out]
            "
        >
            <span>
                {count > 0
                    ? `${count} new message${count > 1 ? "s" : ""}`
                    : "New messages"}
            </span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
        </button>
    );
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
    const markRead = useMutation(api.readReceipts.markConversationRead);

    const messages = useQuery(api.messages.getMessages, {
        conversationId: conversationId as Id<"conversations">,
    });

    const readStatus = useQuery(api.readReceipts.getConversationReadStatus, {
        conversationId: conversationId as Id<"conversations">,
    });

    const initialReadAtRef = useRef<number | null>(null);
    useEffect(() => {
        if (readStatus !== undefined && initialReadAtRef.current === null) {
            initialReadAtRef.current = readStatus.myLastReadAt;
        }
    }, [readStatus]);

    const typingUsers = useTypingUsers(conversationId);

    // ── Smart auto-scroll ────────────────────────────────────────────
    const latestMsg = messages && messages.length > 0 ? messages[messages.length - 1] : null;
    const {
        containerRef,
        bottomRef,
        isScrolledUp,
        newMessageCount,
        scrollToBottom,
    } = useAutoScroll(
        messages?.length ?? 0,
        latestMsg ? String(latestMsg.senderId) : undefined,
        currentUserId,
    );

    // ── Mark as read ─────────────────────────────────────────────────
    const markReadStable = useCallback(() => {
        markRead({ conversationId: conversationId as Id<"conversations"> }).catch(() => { });
    }, [markRead, conversationId]);

    useEffect(() => {
        markReadStable();
    }, [markReadStable, messages?.length]);

    // ── Also scroll to bottom when typing indicator appears (if near bottom)
    useEffect(() => {
        if (typingUsers.length > 0 && !isScrolledUp) {
            requestAnimationFrame(() => {
                bottomRef.current?.scrollIntoView({ behavior: "smooth" });
            });
        }
    }, [typingUsers.length, isScrolledUp, bottomRef]);

    // ── Loading state ────────────────────────────────────────────────
    if (messages === undefined || readStatus === undefined) {
        return (
            <>
                <MessagesSkeleton />
                <ChatInput conversationId={conversationId} recipientName={recipientName} />
            </>
        );
    }

    const frozenReadAt = initialReadAtRef.current ?? 0;
    const otherLastReadAt = readStatus.otherLastReadAt;

    const unreadMessages = messages.filter(
        (m) => String(m.senderId) !== currentUserId && m.createdAt > frozenReadAt
    );
    const dividerCount = unreadMessages.length;

    const firstUnreadIndex =
        dividerCount > 0
            ? messages.findIndex(
                (m) => String(m.senderId) !== currentUserId && m.createdAt > frozenReadAt
            )
            : -1;

    return (
        <>
            <div className="relative flex-1 overflow-hidden">
                <div
                    ref={containerRef}
                    className="h-full overflow-y-auto px-4 py-4 space-y-1"
                >
                    {messages.length === 0 ? (
                        <NoMessagesPlaceholder recipientName={recipientName} />
                    ) : (
                        messages.map((msg, index) => {
                            const isMine = String(msg.senderId) === currentUserId;
                            const prevMsg = index > 0 ? messages[index - 1] : null;
                            const showAvatar = !isMine && (!prevMsg || prevMsg.senderId !== msg.senderId);
                            const sender = conversationMembers.find((m) => m.id === msg.senderId);
                            const isRead = isMine && otherLastReadAt >= msg.createdAt;

                            return (
                                <div key={msg._id as string}>
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

                {/* "New Messages ↓" floating button */}
                {isScrolledUp && newMessageCount > 0 && (
                    <NewMessagesFab count={newMessageCount} onClick={scrollToBottom} />
                )}
            </div>

            <ChatInput conversationId={conversationId} recipientName={recipientName} />
        </>
    );
}

// ─── ChatWindow ───────────────────────────────────────────────────────────────
export default function ChatWindow({ conversation, onBack, currentUserId }: ChatWindowProps) {
    const otherLastSeen = conversation ? getOtherLastSeen(conversation, currentUserId) : undefined;
    const online = useIsOnline(otherLastSeen);

    if (!conversation) {
        return <NoConversationPlaceholder />;
    }

    const name = getDisplayName(conversation, currentUserId);
    const avatar = getDisplayAvatar(conversation, currentUserId);

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

            {/* Messages + Input */}
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
