"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import type { Conversation } from "@/types/conversation";
import { formatTime } from "@/lib/formatTime";
import ChatInput from "./ChatInput";
import MessageBubble from "./MessageBubble";

interface ChatWindowProps {
    conversation: Conversation | null;
    onBack?: () => void;
    currentUserId: string;
}

function getDisplayName(conv: Conversation, currentUserId: string): string {
    if (conv.isGroup && conv.name) return conv.name;
    const other = conv.members.find((m) => m.id !== currentUserId) ?? conv.members[0];
    return other?.name ?? "Unknown";
}

function getDisplayAvatar(conv: Conversation, currentUserId: string): string {
    if (conv.isGroup) return `https://api.dicebear.com/7.x/identicon/svg?seed=${conv.id}`;
    const other = conv.members.find((m) => m.id !== currentUserId) ?? conv.members[0];
    return other?.imageUrl ?? "";
}

function isOtherOnline(conv: Conversation, currentUserId: string): boolean {
    if (conv.isGroup) return false;
    const other = conv.members.find((m) => m.id !== currentUserId);
    return other?.isOnline ?? false;
}

// ─── Messages area (separate component so useQuery is only called when conv exists)
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

    // ── Step 3: real-time messages from Convex ──────────────────────────────
    const messages = useQuery(api.messages.getMessages, {
        conversationId: conversationId as Id<"conversations">,
    });

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages?.length]);

    if (messages === undefined) {
        // Loading skeleton
        return (
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div
                        key={i}
                        className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`h-8 rounded-2xl animate-pulse bg-gray-800 ${i % 2 === 0 ? "w-40" : "w-56"}`}
                        />
                    </div>
                ))}
            </div>
        );
    }

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
                        const isMine = msg.senderId === currentUserId;
                        const prevMsg = index > 0 ? messages[index - 1] : null;
                        const showAvatar = !isMine && (!prevMsg || prevMsg.senderId !== msg.senderId);
                        const sender = conversationMembers.find((m) => m.id === msg.senderId);

                        return (
                            <MessageBubble
                                key={msg._id as string}
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
                            />
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>

            <ChatInput
                conversationId={conversationId}
                recipientName={recipientName}
            />
        </>
    );
}

// ─── Main ChatWindow component ────────────────────────────────────────────────
export default function ChatWindow({
    conversation,
    onBack,
    currentUserId,
}: ChatWindowProps) {
    if (!conversation) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-950 text-center px-6">
                <div className="text-6xl mb-4">💬</div>
                <h2 className="text-xl font-semibold text-white mb-2">Your Messages</h2>
                <p className="text-gray-400 text-sm max-w-xs">
                    Select a conversation from the sidebar or search for a user to start chatting.
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
                    <button
                        onClick={onBack}
                        className="md:hidden text-gray-400 hover:text-white transition-colors p-1 -ml-1 mr-1"
                        aria-label="Go back"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                )}

                <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-700">
                        <Image src={avatar} alt={name} width={36} height={36} className="w-full h-full object-cover" unoptimized />
                    </div>
                    {online && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-gray-900" />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-semibold text-white truncate">{name}</h2>
                    <p className={`text-xs ${online ? "text-emerald-400" : "text-gray-500"}`}>
                        {conversation.isGroup
                            ? `${conversation.members.length} members`
                            : online ? "Online" : "Offline"}
                    </p>
                </div>
            </div>

            {/* Live messages area */}
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
