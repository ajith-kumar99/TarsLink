import type { Id } from "../../convex/_generated/dataModel";

export type Message = {
    _id: Id<"messages">;
    conversationId: Id<"conversations">;
    senderId: Id<"users">;
    content: string;
    isDeleted?: boolean;
    reactions?: Array<{
        emoji: string;
        userIds: Id<"users">[];
    }>;
    createdAt: number;
};
