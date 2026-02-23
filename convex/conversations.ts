import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// ─── getConversations ─────────────────────────────────────────────────────────
export const getConversations = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const me = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!me) return [];

        const all = await ctx.db.query("conversations").collect();
        const mine = all.filter((c) => c.members.includes(me._id));

        mine.sort((a, b) => (b.lastMessageTime ?? b.createdAt) - (a.lastMessageTime ?? a.createdAt));

        const enriched = await Promise.all(
            mine.map(async (conv) => {
                const members = await Promise.all(conv.members.map((uid) => ctx.db.get(uid)));
                return {
                    ...conv,
                    members: members
                        .filter(Boolean)
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        .map((m: any) => ({
                            ...m,
                            // Pass raw lastSeen to client — client computes isOnline
                            lastSeen: m.lastSeen ?? 0,
                        })),
                };
            })
        );

        return enriched;
    },
});

// ─── getOrCreateConversation ──────────────────────────────────────────────────
export const getOrCreateConversation = mutation({
    args: {
        otherUserId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const me = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!me) throw new Error("Current user not found in DB");

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

        const newId = await ctx.db.insert("conversations", {
            members: [me._id, args.otherUserId],
            isGroup: false,
            createdAt: Date.now(),
        });
        return newId;
    },
});
