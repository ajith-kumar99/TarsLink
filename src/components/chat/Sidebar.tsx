"use client";

import { useState } from "react";
import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import type { Conversation } from "@/types/conversation";
import { formatTimestamp } from "@/lib/formatTimestamp";
import { useIsOnline } from "@/hooks/useIsOnline";
import UserList from "./UserList";
import { useRouter } from "next/navigation";

interface SidebarProps {
    conversations: Conversation[];
    selectedId: string | null;
    onSelect: (conversation: Conversation) => void;
    currentUserId: string;
    currentUserName: string;
    currentUserImage: string;
    isLoading?: boolean;
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

// ─── ConversationRow ──────────────────────────────────────────────────────────
function ConversationRow({
    conv,
    currentUserId,
    isSelected,
}: {
    conv: Conversation;
    currentUserId: string;
    isSelected: boolean;
}) {
    const router = useRouter();

    const unreadCount = useQuery(api.readReceipts.getUnreadCount, {
        conversationId: conv.id as Id<"conversations">,
    }) ?? 0;

    // Client-side presence — rechecks every 10 s
    const otherLastSeen = getOtherLastSeen(conv, currentUserId);
    const online = useIsOnline(otherLastSeen);

    const hasUnread = unreadCount > 0;
    const name = getDisplayName(conv, currentUserId);
    const avatar = getDisplayAvatar(conv, currentUserId);
    const preview = conv.lastMessage?.content ?? "";
    const time = conv.lastMessage ? formatTimestamp(conv.lastMessage.createdAt) : "";

    return (
        <button
            onClick={() => router.push(`/chat/${conv.id}`)}
            className={`
                w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-800
                ${isSelected ? "bg-gray-800 border-l-2 border-indigo-500" : "border-l-2 border-transparent"}
            `}
        >
            <div className="relative flex-shrink-0">
                <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-700">
                    <Image src={avatar} alt={name} width={44} height={44} className="w-full h-full object-cover" unoptimized />
                </div>
                {online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-gray-900" />
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                    <span className={`text-sm truncate ${hasUnread ? "font-bold text-white" : "font-semibold text-white"}`}>
                        {name}
                    </span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        {time && (
                            <span className={`text-xs ${hasUnread ? "text-indigo-400 font-medium" : "text-gray-500"}`}>
                                {time}
                            </span>
                        )}
                        {hasUnread && (
                            <span className="min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                                {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                        )}
                    </div>
                </div>
                {preview && (
                    <p className={`text-xs truncate mt-0.5 ${hasUnread ? "text-gray-200 font-medium" : "text-gray-400"}`}>
                        {preview}
                    </p>
                )}
            </div>
        </button>
    );
}

type Tab = "chats" | "people";

export default function Sidebar({
    conversations,
    selectedId,
    onSelect,
    currentUserId,
    currentUserName,
    currentUserImage,
    isLoading = false,
}: SidebarProps) {
    const [tab, setTab] = useState<Tab>("chats");

    return (
        <div className="flex flex-col h-full bg-gray-900">
            <div className="px-4 pt-5 pb-3 border-b border-gray-800">
                <h1 className="text-xl font-bold text-white tracking-tight">TarsLink</h1>
                <div className="flex mt-3 bg-gray-800 rounded-xl p-1 gap-1">
                    {(["chats", "people"] as Tab[]).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`
                                flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize
                                ${tab === t ? "bg-indigo-600 text-white shadow" : "text-gray-400 hover:text-gray-200"}
                            `}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                {tab === "chats" && (
                    <nav className="h-full overflow-y-auto py-2">
                        {isLoading ? (
                            <div className="p-4 space-y-3">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-full bg-gray-800 animate-pulse flex-shrink-0" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-3 bg-gray-800 rounded animate-pulse w-3/4" />
                                            <div className="h-2 bg-gray-800 rounded animate-pulse w-1/2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full px-6 text-center mt-8">
                                <div className="text-4xl mb-3">💬</div>
                                <p className="text-gray-400 text-sm">No conversations yet</p>
                                <p className="text-gray-500 text-xs mt-1">
                                    Switch to <span className="text-indigo-400 font-medium">People</span> to start one
                                </p>
                            </div>
                        ) : (
                            conversations.map((conv) => (
                                <ConversationRow
                                    key={conv.id}
                                    conv={conv}
                                    currentUserId={currentUserId}
                                    isSelected={conv.id === selectedId}
                                />
                            ))
                        )}
                    </nav>
                )}

                {tab === "people" && (
                    <div className="h-full overflow-hidden flex flex-col py-2">
                        <UserList />
                    </div>
                )}
            </div>

            <div className="px-4 py-3 border-t border-gray-800 flex items-center gap-3">
                <div className="relative flex-shrink-0">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700">
                        <Image
                            src={currentUserImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUserId}`}
                            alt={currentUserName}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                            unoptimized
                        />
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-gray-900" />
                </div>
                <span className="text-sm font-medium text-gray-200 truncate">{currentUserName}</span>
            </div>
        </div>
    );
}
