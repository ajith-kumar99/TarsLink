import type { User } from "./user";
import type { Message } from "./message";

export type Conversation = {
    id: string;
    name?: string;
    isGroup: boolean;
    members: User[];
    lastMessage?: Message;
};
