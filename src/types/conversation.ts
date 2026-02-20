import type { Id } from "../../convex/_generated/dataModel";

export type Conversation = {
    _id: Id<"conversations">;
    participantIds: Id<"users">[];
    isGroup: boolean;
    groupName?: string;
    lastMessageTime?: number;
};
