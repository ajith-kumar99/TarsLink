"use client";

import { useState } from "react";
import type { Conversation } from "@/types/conversation";
import type { Message } from "@/types/message";
import { mockConversations, mockMessages, CURRENT_USER } from "@/lib/mockData";
import ChatLayout from "@/components/layout/ChatLayout";
import Sidebar from "@/components/chat/Sidebar";
import ChatWindow from "@/components/chat/ChatWindow";

export default function ChatPage() {
    const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Record<string, Message[]>>(mockMessages);

    const handleSelectConversation = (conv: Conversation) => {
        setSelectedConversation(conv);
    };

    const handleSendMessage = (content: string) => {
        if (!selectedConversation) return;

        const newMessage: Message = {
            id: `msg-${Date.now()}`,
            senderId: CURRENT_USER.id,
            content,
            createdAt: Date.now(),
        };

        // Add message to the conversation
        setMessages((prev) => ({
            ...prev,
            [selectedConversation.id]: [...(prev[selectedConversation.id] ?? []), newMessage],
        }));

        // Update last message in sidebar
        setConversations((prev) =>
            prev.map((conv) =>
                conv.id === selectedConversation.id
                    ? { ...conv, lastMessage: newMessage }
                    : conv
            )
        );
    };

    const currentMessages = selectedConversation
        ? (messages[selectedConversation.id] ?? [])
        : [];

    return (
        <ChatLayout
            selectedConversation={selectedConversation}
            sidebar={
                <Sidebar
                    conversations={conversations}
                    selectedId={selectedConversation?.id ?? null}
                    onSelect={handleSelectConversation}
                />
            }
            chatWindow={
                <ChatWindow
                    conversation={selectedConversation}
                    messages={currentMessages}
                    onSend={handleSendMessage}
                    onBack={() => setSelectedConversation(null)}
                />
            }
        />
    );
}
