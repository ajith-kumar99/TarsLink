"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { Conversation } from "@/types/conversation";
import type { Message } from "@/types/message";
import ChatLayout from "@/components/layout/ChatLayout";
import Sidebar from "@/components/chat/Sidebar";
import ChatWindow from "@/components/chat/ChatWindow";

// ─── Loading skeleton for sidebar ─────────────────────────────────────────────
function SidebarSkeleton() {
    return (
        <div className="flex flex-col h-full bg-gray-900">
            <div className="px-4 py-5 border-b border-gray-800">
                <div className="h-6 w-28 bg-gray-800 rounded animate-pulse" />
                <div className="h-3 w-16 bg-gray-800 rounded mt-2 animate-pulse" />
            </div>
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
        </div>
    );
}

// ─── Adapter: Convex doc → local Conversation type ────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adaptConversation(doc: any): Conversation {
    return {
        id: doc._id as string,
        isGroup: doc.isGroup as boolean,
        name: doc.name as string | undefined,
        members: [], // populated once user-join queries are wired
        lastMessage: undefined,
    };
}

export default function ChatPage() {
    const { user, isLoading: userLoading } = useCurrentUser();

    // Real-time conversation list from Convex
    const convexConversations = useQuery(api.conversations.getConversations);
    const convLoading = convexConversations === undefined;

    // Local state for selected conversation and local messages (until messages query)
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [localMessages, setLocalMessages] = useState<Record<string, Message[]>>({});

    const handleSendMessage = (content: string) => {
        if (!selectedConversation || !user) return;
        const newMsg: Message = {
            id: `msg-${Date.now()}`,
            senderId: user._id as string,
            content,
            createdAt: Date.now(),
        };
        setLocalMessages((prev) => ({
            ...prev,
            [selectedConversation.id]: [...(prev[selectedConversation.id] ?? []), newMsg],
        }));
    };

    const conversations: Conversation[] = convexConversations
        ? convexConversations.map(adaptConversation)
        : [];

    const currentMessages = selectedConversation
        ? (localMessages[selectedConversation.id] ?? [])
        : [];

    if (userLoading || convLoading) {
        return (
            <ChatLayout
                selectedConversation={null}
                sidebar={<SidebarSkeleton />}
                chatWindow={
                    <div className="flex-1 flex items-center justify-center bg-gray-950">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-gray-400 text-sm">Loading…</p>
                        </div>
                    </div>
                }
            />
        );
    }

    return (
        <ChatLayout
            selectedConversation={selectedConversation}
            sidebar={
                <Sidebar
                    conversations={conversations}
                    selectedId={selectedConversation?.id ?? null}
                    onSelect={setSelectedConversation}
                    currentUserId={user?._id as string ?? ""}
                    currentUserName={user?.name ?? ""}
                    currentUserImage={user?.imageUrl ?? ""}
                />
            }
            chatWindow={
                <ChatWindow
                    conversation={selectedConversation}
                    messages={currentMessages}
                    onSend={handleSendMessage}
                    onBack={() => setSelectedConversation(null)}
                    currentUserId={user?._id as string ?? ""}
                />
            }
        />
    );
}
