export type Message = {
    id: string;
    senderId: string;
    content: string;
    createdAt: number;
    deletedAt?: number;
};
