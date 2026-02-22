import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ─── getMessages ──────────────────────────────────────────────────────────────
/**
 * Returns all messages for a conversation, ordered oldest → newest.
 * Convex subscriptions make this live — both sides see updates instantly.
 */
export const getMessages = query({
    args: {
        conversationId: v.id("conversations"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) =>
                q.eq("conversationId", args.conversationId)
            )
            .order("asc")
            .collect();

        // Enrich each message with sender info
        const enriched = await Promise.all(
            messages.map(async (msg) => {
                const sender = await ctx.db.get(msg.senderId);
                return {
                    ...msg,
                    senderName: sender?.name ?? "Unknown",
                    senderImage: sender?.imageUrl ?? "",
                };
            })
        );

        return enriched;
    },
});

// ─── sendMessage ──────────────────────────────────────────────────────────────
/**
 * Inserts a new message and updates the conversation's lastMessageTime
 * so the sidebar sorts correctly.
 */
export const sendMessage = mutation({
    args: {
        conversationId: v.id("conversations"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const me = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!me) throw new Error("User not found");

        const content = args.content.trim();
        if (!content) throw new Error("Message cannot be empty");

        const now = Date.now();

        // Insert the message
        const messageId = await ctx.db.insert("messages", {
            conversationId: args.conversationId,
            senderId: me._id,
            content,
            createdAt: now,
        });

        // Update conversation's lastMessageTime for sidebar sorting
        await ctx.db.patch(args.conversationId, { lastMessageTime: now });

        return messageId;
    },
});
