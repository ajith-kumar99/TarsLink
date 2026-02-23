"use client";

import type { Conversation } from "@/types/conversation";

interface ChatLayoutProps {
    sidebar: React.ReactNode;
    chatWindow: React.ReactNode;
    selectedConversation: Conversation | null;
}

export default function ChatLayout({
    sidebar,
    chatWindow,
    selectedConversation,
}: ChatLayoutProps) {
    return (
        <div className="flex h-screen w-full overflow-hidden bg-white dark:bg-gray-950">
            {/* Sidebar — hidden on mobile when a conversation is selected */}
            <aside
                className={`
          flex-shrink-0 w-80 border-r border-gray-200 dark:border-gray-800 flex flex-col
          ${selectedConversation ? "hidden md:flex" : "flex w-full md:w-80"}
        `}
            >
                {sidebar}
            </aside>

            {/* Chat area — hidden on mobile when no conversation selected */}
            <main
                className={`
          flex-1 flex flex-col min-w-0
          ${!selectedConversation ? "hidden md:flex" : "flex"}
        `}
            >
                {chatWindow}
            </main>
        </div>
    );
}
