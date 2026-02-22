import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ─── markConversationRead ─────────────────────────────────────────────────────
/**
 * Upserts a readReceipt to now. Called when the user opens / scrolls into a
 * conversation. Convex will push the updated unread count to all subscribers.
 */
export const markConversationRead = mutation({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return;

        const me = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!me) return;

        const existing = await ctx.db
            .query("readReceipts")
            .withIndex("by_user_conversation", (q) =>
                q.eq("userId", me._id).eq("conversationId", args.conversationId)
            )
            .unique();

        const now = Date.now();
        if (existing) {
            await ctx.db.patch(existing._id, { lastReadAt: now });
        } else {
            await ctx.db.insert("readReceipts", {
                userId: me._id,
                conversationId: args.conversationId,
                lastReadAt: now,
            });
        }
    },
});

// ─── getUnreadCount ───────────────────────────────────────────────────────────
/**
 * Returns the number of messages in a conversation that arrived after the
 * current user's lastReadAt. Own messages are never counted as unread.
 */
export const getUnreadCount = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return 0;

        const me = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!me) return 0;

        const receipt = await ctx.db
            .query("readReceipts")
            .withIndex("by_user_conversation", (q) =>
                q.eq("userId", me._id).eq("conversationId", args.conversationId)
            )
            .unique();

        const lastReadAt = receipt?.lastReadAt ?? 0;

        const allMessages = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) =>
                q.eq("conversationId", args.conversationId)
            )
            .collect();

        // Messages after lastReadAt that weren't sent by me
        return allMessages.filter(
            (m) => m.createdAt > lastReadAt && String(m.senderId) !== String(me._id)
        ).length;
    },
});

// ─── getConversationReadStatus ────────────────────────────────────────────────
/**
 * Returns:
 *   myLastReadAt    — current user's last read timestamp (for unread divider)
 *   otherLastReadAt — minimum lastReadAt of all other members (for tick color)
 *
 * Use min so double-blue tick = ALL others have read.
 */
export const getConversationReadStatus = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return { myLastReadAt: 0, otherLastReadAt: 0 };

        const me = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!me) return { myLastReadAt: 0, otherLastReadAt: 0 };

        const myReceipt = await ctx.db
            .query("readReceipts")
            .withIndex("by_user_conversation", (q) =>
                q.eq("userId", me._id).eq("conversationId", args.conversationId)
            )
            .unique();

        const conv = await ctx.db.get(args.conversationId);
        if (!conv) return { myLastReadAt: myReceipt?.lastReadAt ?? 0, otherLastReadAt: 0 };

        const otherIds = conv.members.filter((m) => String(m) !== String(me._id));

        const otherReceipts = await Promise.all(
            otherIds.map((uid) =>
                ctx.db
                    .query("readReceipts")
                    .withIndex("by_user_conversation", (q) =>
                        q.eq("userId", uid).eq("conversationId", args.conversationId)
                    )
                    .unique()
            )
        );

        // min → only blue when ALL others have read
        const otherLastReadAt =
            otherReceipts.length === 0
                ? 0
                : Math.min(...otherReceipts.map((r) => r?.lastReadAt ?? 0));

        return {
            myLastReadAt: myReceipt?.lastReadAt ?? 0,
            otherLastReadAt,
        };
    },
});
