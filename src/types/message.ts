export type Message = {
    id: string;
    senderId: string;
    content: string;
    createdAt: number;
    deletedAt?: number;
    editedAt?: number;
    replyToId?: string;
    replyPreview?: {
        senderName: string;
        content: string;
        isDeleted: boolean;
    };
};
