"use client";

import { useQuery } from "convex/react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { api } from "../../../../convex/_generated/api";
import type { Conversation } from "@/types/conversation";
import ChatLayout from "@/components/layout/ChatLayout";
import Sidebar from "@/components/chat/Sidebar";
import ChatWindow from "@/components/chat/ChatWindow";

// ─── Adapter: Convex enriched doc → local Conversation type ───────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adaptConversation(doc: any): Conversation {
    return {
        id: doc._id as string,
        isGroup: doc.isGroup as boolean,
        name: doc.name as string | undefined,
        members: (doc.members ?? [])
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .filter(Boolean)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((m: any) => ({
                id: m._id as string,
                name: m.name as string,
                imageUrl: m.imageUrl as string,
                isOnline: m.isOnline as boolean,
            })),
        lastMessage: undefined, // populated in messages phase
    };
}

export default function ChatPage() {
    const { user, isLoading: userLoading } = useCurrentUser();

    // ── Step 7: real-time conversations from Convex filtered by membership ────
    const convexConversations = useQuery(api.conversations.getConversations);
    const convLoading = convexConversations === undefined;

    const conversations: Conversation[] = (convexConversations ?? []).map(adaptConversation);

    return (
        <ChatLayout
            selectedConversation={null}
            sidebar={
                <Sidebar
                    conversations={conversations}
                    selectedId={null}
                    onSelect={() => { }}   // navigation handled by router in [conversationId] page
                    currentUserId={user?._id as string ?? ""}
                    currentUserName={user?.name ?? ""}
                    currentUserImage={user?.imageUrl ?? ""}
                    isLoading={userLoading || convLoading}
                />
            }
            chatWindow={
                // No conversation selected — show empty state
                <ChatWindow
                    conversation={null}
                    messages={[]}
                    onSend={() => { }}
                    currentUserId={user?._id as string ?? ""}
                />
            }
        />
    );
}
