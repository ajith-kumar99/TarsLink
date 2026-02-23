import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    imageUrl: v.string(),
    clerkId: v.string(),
    email: v.string(),
    isOnline: v.optional(v.boolean()),
    lastSeen: v.optional(v.number()),   // epoch ms — source of truth for presence
  }).index("by_clerkId", ["clerkId"]),

  conversations: defineTable({
    // Who's in the conversation (both 1-on-1 and group)
    members: v.array(v.id("users")),
    isGroup: v.boolean(),
    name: v.optional(v.string()),
    createdAt: v.number(),
    // Denormalized for fast sidebar sorting
    lastMessageTime: v.optional(v.number()),
  }),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
    createdAt: v.number(),
    deletedAt: v.optional(v.number()),
  }).index("by_conversation", ["conversationId", "createdAt"]),

  // Tracks last time each user read a conversation (for unread counts)
  readReceipts: defineTable({
    userId: v.id("users"),
    conversationId: v.id("conversations"),
    lastReadAt: v.number(),
  }).index("by_user_conversation", ["userId", "conversationId"]),

  // Ephemeral typing state — expires client-side after 2 s
  typing: defineTable({
    userId: v.id("users"),
    conversationId: v.id("conversations"),
    userName: v.string(),
    expiresAt: v.number(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_user_conversation", ["userId", "conversationId"]),
});
