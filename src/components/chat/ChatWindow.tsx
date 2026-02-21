"use client";

import Image from "next/image";
import type { Conversation } from "@/types/conversation";
import type { Message } from "@/types/message";
import { CURRENT_USER } from "@/lib/mockData";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";

interface ChatWindowProps {
    conversation: Conversation | null;
    messages: Message[];
    onSend: (content: string) => void;
    onBack?: () => void;
}

function getDisplayName(conv: Conversation): string {
    if (conv.isGroup && conv.name) return conv.name;
    const other = conv.members.find((m) => m.id !== CURRENT_USER.id) ?? conv.members[0];
    return other?.name ?? "Unknown";
}

function getDisplayAvatar(conv: Conversation): string {
    if (conv.isGroup)
        return `https://api.dicebear.com/7.x/identicon/svg?seed=${conv.id}`;
    const other = conv.members.find((m) => m.id !== CURRENT_USER.id) ?? conv.members[0];
    return other?.imageUrl ?? "";
}

function isOtherOnline(conv: Conversation): boolean {
    if (conv.isGroup) return false;
    const other = conv.members.find((m) => m.id !== CURRENT_USER.id);
    return other?.isOnline ?? false;
}

export default function ChatWindow({
    conversation,
    messages,
    onSend,
    onBack,
}: ChatWindowProps) {
    // ── Empty state — no conversation selected ──────────────────────────────────
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

    const name = getDisplayName(conversation);
    const avatar = getDisplayAvatar(conversation);
    const online = isOtherOnline(conversation);

    return (
        <div className="flex flex-col h-full bg-gray-950">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-900">
                {/* Mobile back button */}
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

                {/* Avatar */}
                <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-700">
                        <Image
                            src={avatar}
                            alt={name}
                            width={36}
                            height={36}
                            className="w-full h-full object-cover"
                            unoptimized
                        />
                    </div>
                    {online && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-gray-900" />
                    )}
                </div>

                {/* Name + status */}
                <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-semibold text-white truncate">{name}</h2>
                    <p className={`text-xs ${online ? "text-emerald-400" : "text-gray-500"}`}>
                        {conversation.isGroup
                            ? `${conversation.members.length} members`
                            : online
                                ? "Online"
                                : "Offline"}
                    </p>
                </div>
            </div>

            {/* Messages list */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="text-5xl mb-3">👋</div>
                        <p className="text-gray-400 text-sm">No messages yet</p>
                        <p className="text-gray-600 text-xs mt-1">Say hello to {name}!</p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isMine = msg.senderId === CURRENT_USER.id;
                        const prevMsg = index > 0 ? messages[index - 1] : null;
                        const showAvatar =
                            !isMine && (!prevMsg || prevMsg.senderId !== msg.senderId);

                        // Find the sender user for group chats
                        const sender = conversation.members.find((m) => m.id === msg.senderId);

                        return (
                            <MessageBubble
                                key={msg.id}
                                message={msg}
                                isMine={isMine}
                                showAvatar={showAvatar}
                                senderName={conversation.isGroup ? sender?.name : undefined}
                                senderAvatar={showAvatar ? sender?.imageUrl : undefined}
                            />
                        );
                    })
                )}
            </div>

            {/* Chat input */}
            <ChatInput onSend={onSend} recipientName={name} />
        </div>
    );
}
