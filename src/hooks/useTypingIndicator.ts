"use client";

// useTypingIndicator — sends typing events and reads who is typing
// TODO: Implement setTyping mutation + getTypingUsers query

export function useTypingIndicator(conversationId: string) {
    const handleTyping = () => {
        // TODO: Call setTyping mutation
    };
    return { handleTyping, typingUsers: [] };
}
