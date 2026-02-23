/**
 * TypeScript interfaces for Convex query return types.
 * These match the shapes returned by enriched Convex queries,
 * providing proper typing without eslint-disable overrides.
 */

/** Shape of a member object returned by the enriched getConversations query */
export interface ConvexMemberDoc {
    _id: string;
    name: string;
    imageUrl: string;
    clerkId: string;
    email: string;
    isOnline?: boolean;
    lastSeen?: number;
}

/** Shape of a conversation returned by the enriched getConversations query */
export interface ConvexConversationDoc {
    _id: string;
    isGroup: boolean;
    name?: string;
    createdAt: number;
    lastMessageTime?: number;
    members: ConvexMemberDoc[];
    lastMessage: {
        content: string;
        senderId: string;
        createdAt: number;
    } | null;
}
