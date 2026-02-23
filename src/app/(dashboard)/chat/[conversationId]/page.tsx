"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { api } from "../../../../../convex/_generated/api";
import type { Conversation } from "@/types/conversation";
import type { ConvexConversationDoc } from "@/types/convex";
import ChatLayout from "@/components/layout/ChatLayout";
import Sidebar from "@/components/chat/Sidebar";
import ChatWindow from "@/components/chat/ChatWindow";

function adaptConversation(doc: ConvexConversationDoc): Conversation {
    return {
        id: doc._id,
        isGroup: doc.isGroup,
        name: doc.name,
        members: (doc.members ?? []).filter(Boolean).map((m) => ({
            id: m._id,
            name: m.name,
            imageUrl: m.imageUrl,
            isOnline: m.isOnline ?? false,
            lastSeen: m.lastSeen,
        })),
        lastMessage: doc.lastMessage
            ? {
                id: "",
                senderId: doc.lastMessage.senderId,
                content: doc.lastMessage.content,
                createdAt: doc.lastMessage.createdAt,
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
