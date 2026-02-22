import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// ─── getConversations ─────────────────────────────────────────────────────────
/**
 * Returns all conversations where the current user is a member,
 * sorted by most recent message first.
 */
export const getConversations = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        // Get current user's Convex ID
        const me = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!me) return [];

        // Fetch all conversations and filter to those containing me
        const all = await ctx.db.query("conversations").collect();
        const mine = all.filter((c) => c.members.includes(me._id));

        // Sort by lastMessageTime descending (most recent first)
        mine.sort((a, b) => (b.lastMessageTime ?? b.createdAt) - (a.lastMessageTime ?? a.createdAt));

        // Enrich each conversation with member user objects
        const enriched = await Promise.all(
            mine.map(async (conv) => {
                const members = await Promise.all(
                    conv.members.map((uid) => ctx.db.get(uid))
                );
                return {
                    ...conv,
                    members: members.filter(Boolean),
                };
            })
        );

        return enriched;
    },
});

// ─── getOrCreateConversation ──────────────────────────────────────────────────
/**
 * For 1-on-1 chats: finds an existing conversation between the two users,
 * or creates one if it doesn't exist. Never creates duplicates.
 */
export const getOrCreateConversation = mutation({
    args: {
        otherUserId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        // Resolve current user
        const me = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!me) throw new Error("Current user not found in DB");

        // Look for an existing 1-on-1 conversation between exactly these two users
        const all = await ctx.db.query("conversations").collect();
        const existing = all.find((c) => {
            if (c.isGroup) return false;
            const ids = c.members.map(String);
            return (
                ids.length === 2 &&
                ids.includes(String(me._id)) &&
                ids.includes(String(args.otherUserId))
            );
        });

        if (existing) return existing._id;

        // Create new 1-on-1 conversation
        const newId = await ctx.db.insert("conversations", {
            members: [me._id, args.otherUserId],
            isGroup: false,
            createdAt: Date.now(),
        });
        return newId;
    },
});
