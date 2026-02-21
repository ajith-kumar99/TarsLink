import type { User } from "@/types/user";
import type { Message } from "@/types/message";
import type { Conversation } from "@/types/conversation";

// ─── Mock Users ───────────────────────────────────────────────────────────────

export const CURRENT_USER: User = {
    id: "me",
    name: "You",
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=currentuser",
    isOnline: true,
};

export const mockUsers: User[] = [
    {
        id: "user-1",
        name: "Alex Rivera",
        imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
        isOnline: true,
    },
    {
        id: "user-2",
        name: "Priya Sharma",
        imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=priya",
        isOnline: false,
    },
    {
        id: "user-3",
        name: "Jordan Kim",
        imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=jordan",
        isOnline: true,
    },
    {
        id: "user-4",
        name: "Sam Patel",
        imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=sam",
        isOnline: false,
    },
    {
        id: "user-5",
        name: "Maya Chen",
        imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=maya",
        isOnline: true,
    },
];

// ─── Mock Messages ────────────────────────────────────────────────────────────

const now = Date.now();
const mins = (n: number) => now - n * 60 * 1000;
const days = (n: number) => now - n * 24 * 60 * 60 * 1000;

export const mockMessages: Record<string, Message[]> = {
    "conv-1": [
        { id: "m1", senderId: "user-1", content: "Hey! How's the new project going?", createdAt: mins(45) },
        { id: "m2", senderId: "me", content: "Going great! Just finished the auth flow. Convex + Clerk is a solid combo.", createdAt: mins(43) },
        { id: "m3", senderId: "user-1", content: "Nice! Did you struggle with the JWT setup?", createdAt: mins(40) },
        { id: "m4", senderId: "me", content: "A little at first, but the docs are pretty clear once you get the flow.", createdAt: mins(38) },
        { id: "m5", senderId: "user-1", content: "Let me know if you need help with real-time queries — I've done a few projects with Convex.", createdAt: mins(35) },
        { id: "m6", senderId: "me", content: "Will do, thanks! 🙌", createdAt: mins(2) },
    ],
    "conv-2": [
        { id: "m7", senderId: "user-2", content: "Can you review my PR when you get a chance?", createdAt: days(2) },
        { id: "m8", senderId: "me", content: "Sure, I'll take a look this afternoon.", createdAt: days(2) },
        { id: "m9", senderId: "user-2", content: "No rush! It's mostly refactoring, just want a second pair of eyes.", createdAt: days(1) },
        { id: "m10", senderId: "me", content: "Just reviewed it. Left a few comments. Overall looks really clean!", createdAt: days(1) },
        { id: "m11", senderId: "user-2", content: "Thanks so much! Merging it now.", createdAt: days(1) },
    ],
    "conv-3": [
        { id: "m12", senderId: "user-3", content: "Are we still meeting tomorrow?", createdAt: mins(120) },
        { id: "m13", senderId: "me", content: "Yes! 3pm works for me.", createdAt: mins(115) },
        { id: "m14", senderId: "user-4", content: "Same here. Should we do a video call or in-person?", createdAt: mins(110) },
        { id: "m15", senderId: "user-3", content: "Video call is easier. I'll send the link.", createdAt: mins(100) },
        { id: "m16", senderId: "me", content: "Perfect. See you all tomorrow 👍", createdAt: mins(10) },
    ],
    "conv-4": [
        { id: "m17", senderId: "user-4", content: "Hey, do you have the Figma link for the new designs?", createdAt: days(5) },
        { id: "m18", senderId: "me", content: "Yeah one sec, let me grab it...", createdAt: days(5) },
        { id: "m19", senderId: "me", content: "https://figma.com/file/abc123 (mock)", createdAt: days(5) },
        { id: "m20", senderId: "user-4", content: "Thanks! These look incredible by the way.", createdAt: days(4) },
    ],
    "conv-5": [
        { id: "m21", senderId: "user-5", content: "Just shipped the feature! Live in production ✨", createdAt: mins(5) },
        { id: "m22", senderId: "me", content: "That was fast! Great work 🎉", createdAt: mins(3) },
        { id: "m23", senderId: "user-5", content: "Couldn't have done it without your help with the bug last week 😄", createdAt: mins(1) },
    ],
};

// ─── Mock Conversations ───────────────────────────────────────────────────────

export const mockConversations: Conversation[] = [
    {
        id: "conv-1",
        isGroup: false,
        members: [mockUsers[0]],
        lastMessage: mockMessages["conv-1"].at(-1),
    },
    {
        id: "conv-2",
        isGroup: false,
        members: [mockUsers[1]],
        lastMessage: mockMessages["conv-2"].at(-1),
    },
    {
        id: "conv-3",
        name: "Team Standup",
        isGroup: true,
        members: [mockUsers[2], mockUsers[3]],
        lastMessage: mockMessages["conv-3"].at(-1),
    },
    {
        id: "conv-4",
        isGroup: false,
        members: [mockUsers[3]],
        lastMessage: mockMessages["conv-4"].at(-1),
    },
    {
        id: "conv-5",
        isGroup: false,
        members: [mockUsers[4]],
        lastMessage: mockMessages["conv-5"].at(-1),
    },
];
