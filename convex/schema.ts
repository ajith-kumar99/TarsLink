import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    imageUrl: v.string(),
    clerkId: v.string(),
    email: v.string(),
    isOnline: v.optional(v.boolean()),
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
    isDeleted: v.optional(v.boolean()),
  }).index("by_conversation", ["conversationId", "createdAt"]),
});
