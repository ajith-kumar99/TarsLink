"use client";

// useConversation — returns messages and helpers for a given conversation
// TODO: Implement using useQuery(api.messages.list)

export function useConversation(conversationId: string) {
    return { messages: [], isLoading: true };
}
