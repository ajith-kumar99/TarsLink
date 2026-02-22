"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import type { Conversation } from "@/types/conversation";
import type { Message } from "@/types/message";
import ChatLayout from "@/components/layout/ChatLayout";
import Sidebar from "@/components/chat/Sidebar";
import ChatWindow from "@/components/chat/ChatWindow";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adaptConversation(doc: any): Conversation {
    return {
        id: doc._id as string,
        isGroup: doc.isGroup as boolean,
        name: doc.name as string | undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        members: (doc.members ?? []).filter(Boolean).map((m: any) => ({
            id: m._id as string,
            name: m.name as string,
            imageUrl: m.imageUrl as string,
            isOnline: m.isOnline as boolean,
        })),
        lastMessage: undefined,
    };
}

export default function ConversationPage() {
    const params = useParams();
    const conversationId = params.conversationId as string;

    const { user, isLoading: userLoading } = useCurrentUser();

    // All sidebar conversations
    const convexConversations = useQuery(api.conversations.getConversations);
    const convLoading = convexConversations === undefined;

    const conversations: Conversation[] = (convexConversations ?? []).map(adaptConversation);

    // Currently open conversation
    const selectedConversation = conversations.find((c) => c.id === conversationId) ?? null;

    // Local messages state (real messages query comes in the next phase)
    const [localMessages, setLocalMessages] = useState<Message[]>([]);

    const handleSendMessage = (content: string) => {
        if (!user) return;
        setLocalMessages((prev) => [
            ...prev,
            {
                id: `msg-${Date.now()}`,
                senderId: user._id as string,
                content,
                createdAt: Date.now(),
            },
        ]);
    };

    return (
        <ChatLayout
            selectedConversation={selectedConversation}
            sidebar={
                <Sidebar
                    conversations={conversations}
                    selectedId={conversationId}
                    onSelect={() => { }}
                    currentUserId={user?._id as string ?? ""}
                    currentUserName={user?.name ?? ""}
                    currentUserImage={user?.imageUrl ?? ""}
                    isLoading={userLoading || convLoading}
                />
            }
            chatWindow={
                <ChatWindow
                    conversation={selectedConversation}
                    messages={localMessages}
                    onSend={handleSendMessage}
                    currentUserId={user?._id as string ?? ""}
                />
            }
        />
    );
}
