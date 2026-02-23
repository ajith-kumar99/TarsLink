"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useQuery } from "convex/react";
import { useClerk } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import type { Conversation } from "@/types/conversation";
import { formatTimestamp } from "@/lib/formatTimestamp";
import { useIsOnline } from "@/hooks/useIsOnline";
import UserList from "./UserList";
import CreateGroupDialog from "./CreateGroupDialog";
import ThemeToggle from "../shared/ThemeToggle";
import { useRouter } from "next/navigation";

interface SidebarProps {
    conversations: Conversation[];
    selectedId: string | null;
    onSelect: (conversation: Conversation) => void;
    currentUserId: string;
    currentUserName: string;
    currentUserImage: string;
    currentUserEmail?: string;
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

// ─── Chat filter type ─────────────────────────────────────────────────────────
type ChatFilter = "all" | "unread" | "groups";

// ─── ConversationRow ──────────────────────────────────────────────────────────
function ConversationRow({
    conv,
    currentUserId,
    isSelected,
    filterMode,
}: {
    conv: Conversation;
    currentUserId: string;
    isSelected: boolean;
    filterMode: ChatFilter;
}) {
    const router = useRouter();

    const unreadCount = useQuery(api.readReceipts.getUnreadCount, {
        conversationId: conv.id as Id<"conversations">,
    }) ?? 0;

    // Client-side presence — rechecks every 10 s
    const otherLastSeen = getOtherLastSeen(conv, currentUserId);
    const online = useIsOnline(otherLastSeen);

    // ── Filter logic: self-hide based on filterMode ──
    if (filterMode === "unread" && unreadCount === 0) return null;
    if (filterMode === "groups" && !conv.isGroup) return null;

    const hasUnread = unreadCount > 0;
    const name = getDisplayName(conv, currentUserId);
    const avatar = getDisplayAvatar(conv, currentUserId);
    const preview = conv.lastMessage?.content ?? "";
    const time = conv.lastMessage ? formatTimestamp(conv.lastMessage.createdAt) : "";

    return (
        <button
            onClick={() => router.push(`/chat/${conv.id}`)}
            className={`
                w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-800
                ${isSelected ? "bg-indigo-50 dark:bg-gray-800 border-l-2 border-indigo-500" : "border-l-2 border-transparent"}
            `}
        >
            <div className="relative flex-shrink-0">
                <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                    <Image src={avatar} alt={name} width={44} height={44} className="w-full h-full object-cover" unoptimized />
                </div>
                {online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900" />
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                    <span className={`text-sm truncate ${hasUnread ? "font-bold text-gray-900 dark:text-white" : "font-semibold text-gray-900 dark:text-white"}`}>
                        {name}
                    </span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        {time && (
                            <span className={`text-xs ${hasUnread ? "text-indigo-500 dark:text-indigo-400 font-medium" : "text-gray-400 dark:text-gray-500"}`}>
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
                    <p className={`text-xs truncate mt-0.5 ${hasUnread ? "text-gray-700 dark:text-gray-200 font-medium" : "text-gray-500 dark:text-gray-400"}`}>
                        {preview}
                    </p>
                )}
            </div>
        </button>
    );
}

// ─── ProfileCard popover ──────────────────────────────────────────────────────
function ProfileCard({
    name,
    email,
    imageUrl,
    onClose,
    toggleRef,
}: {
    name: string;
    email: string;
    imageUrl: string;
    onClose: () => void;
    toggleRef: React.RefObject<HTMLButtonElement | null>;
}) {
    const { signOut } = useClerk();
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            // Ignore clicks inside the card or on the toggle button
            if (cardRef.current?.contains(target)) return;
            if (toggleRef.current?.contains(target)) return;
            onClose();
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose, toggleRef]);

    return (
        <div
            ref={cardRef}
            className="
                absolute bottom-full left-4 right-4 mb-2 z-50
                bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                rounded-2xl shadow-xl dark:shadow-black/40
                overflow-hidden
                animate-[fadeSlideUp_0.2s_ease-out]
            "
        >
            {/* Profile info */}
            <div className="px-4 pt-4 pb-3 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0 ring-2 ring-indigo-500/20">
                    <Image
                        src={imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=default`}
                        alt={name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                        unoptimized
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{name}</p>
                    {email && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{email}</p>
                    )}
                    <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        Active now
                    </span>
                </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gray-100 dark:bg-gray-700 mx-3" />

            {/* Sign out */}
            <div className="px-3 py-2">
                <button
                    onClick={() => signOut({ redirectUrl: "/sign-in" })}
                    className="
                        w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium
                        text-red-600 dark:text-red-400
                        hover:bg-red-50 dark:hover:bg-red-500/10
                        transition-colors
                    "
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign out
                </button>
            </div>
        </div>
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
    currentUserEmail = "",
    isLoading = false,
}: SidebarProps) {
    const [tab, setTab] = useState<Tab>("chats");
    const [showGroupDialog, setShowGroupDialog] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const profileToggleRef = useRef<HTMLButtonElement>(null);
    const [chatFilter, setChatFilter] = useState<ChatFilter>("all");

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900">
            {/* ── Header ── */}
            <div className="px-4 pt-5 pb-3 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">TarsLink</h1>
                    <div className="flex items-center gap-1">
                        <ThemeToggle />
                        <button
                            onClick={() => setShowGroupDialog(true)}
                            className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                            aria-label="New group chat"
                            title="New group chat"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* ── Tab switcher ── */}
                <div className="flex mt-3 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-1">
                    {(["chats", "people"] as Tab[]).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`
                                flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize
                                ${tab === t ? "bg-indigo-600 text-white shadow" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}
                            `}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Chat filter pills (only in chats tab) ── */}
            {tab === "chats" && (
                <div className="px-4 pt-3 pb-1 flex items-center gap-1.5">
                    {(["all", "unread", "groups"] as ChatFilter[]).map((f) => (
                        <button
                            key={f}
                            onClick={() => setChatFilter(f)}
                            className={`
                                px-3 py-1 text-xs font-medium rounded-full transition-all capitalize
                                ${chatFilter === f
                                    ? "bg-indigo-600 text-white shadow-sm"
                                    : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200"
                                }
                            `}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            )}

            {/* ── Content ── */}
            <div className="flex-1 overflow-hidden">
                {tab === "chats" && (
                    <nav className="h-full overflow-y-auto py-2">
                        {isLoading ? (
                            <div className="p-4 space-y-3">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse flex-shrink-0" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-3/4" />
                                            <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-1/2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full px-6 text-center mt-8">
                                <div className="text-4xl mb-3">💬</div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">No conversations yet</p>
                                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                                    Switch to <button type="button" onClick={() => setTab("people")} className="text-indigo-500 dark:text-indigo-400 font-medium hover:underline">People</button> to start one
                                </p>
                            </div>
                        ) : (
                            conversations.map((conv) => (
                                <ConversationRow
                                    key={conv.id}
                                    conv={conv}
                                    currentUserId={currentUserId}
                                    isSelected={conv.id === selectedId}
                                    filterMode={chatFilter}
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

            {/* ── Profile footer ── */}
            <div className="relative px-4 py-3 border-t border-gray-200 dark:border-gray-800">
                {showProfile && (
                    <ProfileCard
                        name={currentUserName}
                        email={currentUserEmail}
                        imageUrl={currentUserImage}
                        onClose={() => setShowProfile(false)}
                        toggleRef={profileToggleRef}
                    />
                )}

                <button
                    ref={profileToggleRef}
                    onClick={() => setShowProfile((v) => !v)}
                    className="w-full flex items-center gap-3 rounded-xl px-2 py-1.5 -mx-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                    <div className="relative flex-shrink-0">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 ring-2 ring-transparent hover:ring-indigo-500/30 transition-all">
                            <Image
                                src={currentUserImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUserId}`}
                                alt={currentUserName}
                                width={36}
                                height={36}
                                className="w-full h-full object-cover"
                                unoptimized
                            />
                        </div>
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">{currentUserName}</p>
                        {currentUserEmail && (
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{currentUserEmail}</p>
                        )}
                    </div>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${showProfile ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                </button>
            </div>

            {/* Group creation dialog */}
            <CreateGroupDialog open={showGroupDialog} onClose={() => setShowGroupDialog(false)} />
        </div>
    );
}
