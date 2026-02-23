"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import type { Conversation } from "@/types/conversation";
import type { Message } from "@/types/message";
import { useIsOnline } from "@/hooks/useIsOnline";
import { useAutoScroll } from "@/hooks/useAutoScroll";
import ChatInput from "./ChatInput";
import MessageBubble from "./MessageBubble";
import ChatSummaryDialog from "./ChatSummaryDialog";

interface ChatWindowProps {
    conversation: Conversation | null;
    onBack?: () => void; // deprecated — ChatWindow now uses useRouter internally
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

// ─── Loading skeleton ─────────────────────────────────────────────────────────
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
                            <div className="w-7 h-7 rounded-full bg-gray-200/60 dark:bg-gray-800/60 animate-pulse flex-shrink-0" />
                        )}
                        <div className={`h-10 rounded-2xl animate-pulse ${row.w} ${row.align === "end" ? "bg-indigo-100/50 dark:bg-indigo-900/30" : "bg-gray-200/60 dark:bg-gray-800/60"}`} />
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Empty states ─────────────────────────────────────────────────────────────
function NoMessagesPlaceholder({ recipientName }: { recipientName: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center px-6 relative overflow-hidden">
            {/* Subtle background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />

            <div className="relative animate-float">

                {/* Main icon container with glassmorphism */}
                <div className="w-24 h-24 rounded-full bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border border-white dark:border-gray-800 shadow-xl shadow-indigo-500/10 flex items-center justify-center mb-6 relative z-10">
                    {/* Animated gradient ring */}

                    <span className="text-5xl animate-wave origin-bottom-right drop-shadow-md">
                        👋
                    </span>
                </div>
            </div>

            <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 mb-2 relative z-10">
                It's quiet in here...
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-[260px] leading-relaxed relative z-10">
                Send a message to <span className="font-semibold text-indigo-600 dark:text-indigo-400">{recipientName}</span> to start conversational magic.
            </p>
        </div>
    );
}

function NoConversationPlaceholder() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/50 dark:bg-gray-950/50 backdrop-blur-sm text-center px-6 relative overflow-hidden">
            {/* Ambient background glows */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen pointer-events-none animate-float" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-violet-500/10 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen pointer-events-none animate-float" style={{ animationDelay: '2s' }} />

            <div className="relative z-10 animate-float">
                <div className="w-24 h-24 rounded-3xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-white/50 dark:border-gray-800/50 shadow-2xl shadow-indigo-500/10 flex items-center justify-center mb-6 ring-1 ring-black/5 dark:ring-white/5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-inner">
                        <svg className="w-7 h-7 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                        </svg>
                    </div>
                </div>
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-3 relative z-10">
                Welcome to TarsLink
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-[15px] max-w-sm leading-relaxed relative z-10">
                Select a conversation from the sidebar or head over to the{" "}
                <span className="mx-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium border border-indigo-100 dark:border-indigo-500/20 shadow-sm">People</span>
                tab to discover new connections.
            </p>
        </div>
    );
}

// ─── New Messages FAB ─────────────────────────────────────────────────────────
function NewMessagesFab({ count, onClick }: { count: number; onClick: () => void }) {
    return (
        <div className="absolute bottom-4 inset-x-0 flex justify-center z-10 pointer-events-none">
            <button
                onClick={onClick}
                className="
                    pointer-events-auto
                    inline-flex items-center gap-1.5 px-4 py-2
                    bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700
                    text-white text-xs font-semibold
                    rounded-full
                    shadow-lg shadow-black/30
                    transition-colors duration-150
                    animate-[fadeSlideUp_0.25s_ease-out]
                "
            >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                {count > 0
                    ? `${count} new message${count > 1 ? "s" : ""}`
                    : "New messages"}
            </button>
        </div>
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
    const [replyTo, setReplyTo] = useState<Message | null>(null);
    const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    const handleReply = useCallback((message: Message) => {
        setReplyTo(message);
    }, []);

    const handleScrollToMessage = useCallback((messageId: string) => {
        const el = messageRefs.current.get(messageId);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            // Flash highlight
            el.classList.add("ring-2", "ring-indigo-500/50", "bg-indigo-500/10");
            setTimeout(() => {
                el.classList.remove("ring-2", "ring-indigo-500/50", "bg-indigo-500/10");
            }, 1500);
        }
    }, []);
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

    // ── Scroll for typing indicator (only if near bottom) ────────────
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
            {/* Scrollable messages area — relative so the FAB can position absolutely inside */}
            <div className="relative flex-1 min-h-0 flex flex-col">
                <div
                    ref={containerRef}
                    className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
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
                                <div
                                    key={msg._id as string}
                                    ref={(el) => {
                                        if (el) messageRefs.current.set(msg._id as string, el);
                                    }}
                                    className="rounded-xl transition-all duration-500"
                                >
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
                                            deletedAt: msg.deletedAt,
                                            editedAt: msg.editedAt,
                                            replyToId: msg.replyToId as string | undefined,
                                            replyPreview: msg.replyPreview ?? undefined,
                                        }}
                                        isMine={isMine}
                                        showAvatar={showAvatar}
                                        senderName={isGroup ? (sender?.name ?? msg.senderName) : undefined}
                                        senderAvatar={showAvatar ? (sender?.imageUrl ?? msg.senderImage) : undefined}
                                        isRead={isRead}
                                        currentUserId={currentUserId}
                                        onReply={handleReply}
                                        onScrollToMessage={handleScrollToMessage}
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
                                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                                </div>
                                <span className="text-xs text-gray-400 dark:text-gray-600 mt-1 ml-1">
                                    {typingUsers.length === 1
                                        ? `${typingUsers[0].userName} is typing…`
                                        : `${typingUsers.map((u) => u.userName).join(", ")} are typing…`}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Scroll anchor */}
                    <div ref={bottomRef} className="h-px" />
                </div>

                {/* ↓ New Messages floating button */}
                {isScrolledUp && newMessageCount > 0 && (
                    <NewMessagesFab count={newMessageCount} onClick={scrollToBottom} />
                )}
            </div>

            <ChatInput
                conversationId={conversationId}
                recipientName={recipientName}
                replyTo={replyTo}
                onClearReply={() => setReplyTo(null)}
            />
        </>
    );
}

// ─── GroupMemberRow ───────────────────────────────────────────────────────────
function GroupMemberRow({ member, isCurrentUser }: { member: Conversation["members"][0]; isCurrentUser: boolean }) {
    const online = useIsOnline(member.lastSeen);
    return (
        <div className="flex items-center gap-3 px-4 py-2.5">
            <div className="relative flex-shrink-0">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                    <Image src={member.imageUrl} alt={member.name} width={32} height={32} className="w-full h-full object-cover" unoptimized />
                </div>
                {online && <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border-[1.5px] border-white dark:border-gray-900" />}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {member.name}
                    {isCurrentUser && <span className="text-xs text-indigo-400 ml-1.5">(You)</span>}
                </p>
                <p className={`text-xs ${online ? "text-emerald-400" : "text-gray-500"}`}>
                    {online ? "Online" : "Offline"}
                </p>
            </div>
        </div>
    );
}

// ─── ChatWindow ───────────────────────────────────────────────────────────────
export default function ChatWindow({ conversation, currentUserId }: ChatWindowProps) {
    const router = useRouter();
    const otherLastSeen = conversation ? getOtherLastSeen(conversation, currentUserId) : undefined;
    const online = useIsOnline(otherLastSeen);
    const [showMembers, setShowMembers] = useState(false);
    const [showSummary, setShowSummary] = useState(false);

    if (!conversation) {
        return <NoConversationPlaceholder />;
    }

    const name = getDisplayName(conversation, currentUserId);
    const avatar = getDisplayAvatar(conversation, currentUserId);

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                {/* Mobile back button */}
                <button
                    onClick={() => router.push("/chat")}
                    className="md:hidden text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-1 -ml-1 mr-1"
                    aria-label="Go back"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                        <Image src={avatar} alt={name} width={36} height={36} className="w-full h-full object-cover" unoptimized />
                    </div>
                    {online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900" />}
                </div>

                {/* Clickable name / status — toggles members panel for groups */}
                <button
                    onClick={() => conversation.isGroup && setShowMembers((v) => !v)}
                    className={`flex-1 min-w-0 text-left ${conversation.isGroup ? "cursor-pointer hover:opacity-80 transition-opacity" : "cursor-default"}`}
                >
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{name}</h2>
                    <p className={`text-xs ${conversation.isGroup ? "text-gray-400" : online ? "text-emerald-400" : "text-gray-500"}`}>
                        {conversation.isGroup
                            ? `${conversation.members.length} members · tap to ${showMembers ? "hide" : "view"}`
                            : online ? "Online" : "Offline"}
                    </p>
                </button>

                {/* AI Summary button */}
                <button
                    onClick={() => setShowSummary(true)}
                    className="p-1.5 rounded-lg transition-colors text-gray-500 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    aria-label="AI Summary"
                    title="Summarize chat with AI"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
                        />
                    </svg>
                </button>

                {/* Members toggle icon for groups */}
                {conversation.isGroup && (
                    <button
                        onClick={() => setShowMembers((v) => !v)}
                        className={`p-1.5 rounded-lg transition-colors ${showMembers ? "bg-indigo-600/20 text-indigo-400" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                        aria-label="Toggle members panel"
                        title="Group members"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Group Members Panel (slides open) */}
            {conversation.isGroup && showMembers && (
                <div className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 overflow-y-auto max-h-60">
                    <div className="flex items-center justify-between px-4 pt-3 pb-1">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                            Members ({conversation.members.length})
                        </p>
                    </div>
                    <div className="py-1">
                        {conversation.members.map((member) => (
                            <GroupMemberRow
                                key={member.id}
                                member={member}
                                isCurrentUser={member.id === currentUserId}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Messages + Input */}
            <MessagesArea
                conversationId={conversation.id}
                currentUserId={currentUserId}
                conversationMembers={conversation.members}
                isGroup={conversation.isGroup}
                recipientName={name}
            />

            {/* AI Summary Dialog */}
            <ChatSummaryDialog
                conversationId={conversation.id}
                conversationName={name}
                open={showSummary}
                onClose={() => setShowSummary(false)}
            />
        </div>
    );
}

