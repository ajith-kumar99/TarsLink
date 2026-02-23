"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { api } from "../../../../../convex/_generated/api";
import type { Conversation } from "@/types/conversation";
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
            lastSeen: m.lastSeen as number | undefined,
        })),
        lastMessage: doc.lastMessage
            ? {
                id: "",
                senderId: doc.lastMessage.senderId as string,
                content: doc.lastMessage.content as string,
                createdAt: doc.lastMessage.createdAt as number,
            }
            : undefined,
    };
}

export default function ConversationPage() {
    const params = useParams();
    const conversationId = params.conversationId as string;
    const { user, isLoading: userLoading } = useCurrentUser();

    const convexConversations = useQuery(api.conversations.getConversations);
    const convLoading = convexConversations === undefined;

    const conversations: Conversation[] = (convexConversations ?? []).map(adaptConversation);
    const selectedConversation = conversations.find((c) => c.id === conversationId) ?? null;

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
                    currentUserEmail={user?.email ?? ""}
                    isLoading={userLoading || convLoading}
                />
            }
            chatWindow={
                <ChatWindow
                    conversation={selectedConversation}
                    currentUserId={user?._id as string ?? ""}
                />
            }
        />
    );
}
