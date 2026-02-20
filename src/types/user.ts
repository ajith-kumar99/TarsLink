import type { Id } from "../../convex/_generated/dataModel";

export type User = {
    _id: Id<"users">;
    clerkId: string;
    name: string;
    email: string;
    imageUrl?: string;
    lastSeen?: number;
};
