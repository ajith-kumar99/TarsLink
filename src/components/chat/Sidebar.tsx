"use client";

import Image from "next/image";
import type { Conversation } from "@/types/conversation";
import { formatTime } from "@/lib/formatTime";

interface SidebarProps {
    conversations: Conversation[];
    selectedId: string | null;
    onSelect: (conversation: Conversation) => void;
    currentUserId: string;
    currentUserName: string;
    currentUserImage: string;
}

function getDisplayName(conv: Conversation, currentUserId: string): string {
    if (conv.isGroup && conv.name) return conv.name;
    const other = conv.members.find((m) => m.id !== currentUserId) ?? conv.members[0];
    return other?.name ?? "Unknown";
}

function getDisplayAvatar(conv: Conversation, currentUserId: string): string {
    if (conv.isGroup) {
        return `https://api.dicebear.com/7.x/identicon/svg?seed=${conv.id}`;
    }
    const other = conv.members.find((m) => m.id !== currentUserId) ?? conv.members[0];
    return other?.imageUrl ?? "";
}

function isOtherOnline(conv: Conversation, currentUserId: string): boolean {
    if (conv.isGroup) return false;
    const other = conv.members.find((m) => m.id !== currentUserId);
    return other?.isOnline ?? false;
}

export default function Sidebar({
    conversations,
    selectedId,
    onSelect,
    currentUserId,
    currentUserName,
    currentUserImage,
}: SidebarProps) {
    return (
        <div className="flex flex-col h-full bg-gray-900">
            {/* Header */}
            <div className="px-4 py-5 border-b border-gray-800">
                <h1 className="text-xl font-bold text-white tracking-tight">TarsLink</h1>
                <p className="text-xs text-gray-400 mt-0.5">Messages</p>
            </div>

            {/* Conversations list */}
            <nav className="flex-1 overflow-y-auto py-2">
                {conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                        <div className="text-4xl mb-3">💬</div>
                        <p className="text-gray-400 text-sm">No conversations yet</p>
                        <p className="text-gray-600 text-xs mt-1">Search for a user to start chatting</p>
                    </div>
                ) : (
                    conversations.map((conv) => {
                        const name = getDisplayName(conv, currentUserId);
                        const avatar = getDisplayAvatar(conv, currentUserId);
                        const online = isOtherOnline(conv, currentUserId);
                        const isSelected = conv.id === selectedId;
                        const preview = conv.lastMessage?.content ?? "";
                        const time = conv.lastMessage ? formatTime(conv.lastMessage.createdAt) : "";

                        return (
                            <button
                                key={conv.id}
                                onClick={() => onSelect(conv)}
                                className={`
                  w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                  hover:bg-gray-800 active:bg-gray-750
                  ${isSelected ? "bg-gray-800 border-l-2 border-indigo-500" : "border-l-2 border-transparent"}
                `}
                            >
                                {/* Avatar + online dot */}
                                <div className="relative flex-shrink-0">
                                    <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-700">
                                        <Image
                                            src={avatar}
                                            alt={name}
                                            width={44}
                                            height={44}
                                            className="w-full h-full object-cover"
                                            unoptimized
                                        />
                                    </div>
                                    {online && (
                                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-gray-900" />
                                    )}
                                </div>

                                {/* Name + preview */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-white truncate">{name}</span>
                                        {time && (
                                            <span className="text-xs text-gray-500 ml-2 flex-shrink-0">{time}</span>
                                        )}
                                    </div>
                                    {preview && (
                                        <p className="text-xs text-gray-400 truncate mt-0.5">{preview}</p>
                                    )}
                                </div>
                            </button>
                        );
                    })
                )}
            </nav>

            {/* Current user footer */}
            <div className="px-4 py-3 border-t border-gray-800 flex items-center gap-3">
                <div className="relative flex-shrink-0">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700">
                        <Image
                            src={currentUserImage}
                            alt={currentUserName}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                            unoptimized
                        />
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-gray-900" />
                </div>
                <span className="text-sm font-medium text-gray-200">{currentUserName}</span>
            </div>
        </div>
    );
}
