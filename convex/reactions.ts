import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const ALLOWED_EMOJIS = ["👍", "❤️", "😂", "😮", "😢"];

// ─── getReactions ─────────────────────────────────────────────────────────────
/**
 * Returns all reactions for a given message, grouped by emoji.
 * Each group has { emoji, count, userIds }.
 * Convex subscriptions make this live.
 */
export const getReactions = query({
    args: {
        messageId: v.id("messages"),
    },
    handler: async (ctx, args) => {
        const reactions = await ctx.db
            .query("messageReactions")
            .withIndex("by_message", (q) => q.eq("messageId", args.messageId))
            .collect();

        // Group by emoji
        const grouped: Record<string, { emoji: string; count: number; userIds: string[] }> = {};
        for (const r of reactions) {
            if (!grouped[r.emoji]) {
                grouped[r.emoji] = { emoji: r.emoji, count: 0, userIds: [] };
            }
            grouped[r.emoji].count++;
            grouped[r.emoji].userIds.push(r.userId as string);
        }

        return Object.values(grouped);
    },
});

// ─── getReactionsForMessages ──────────────────────────────────────────────────
/**
 * Batch query: returns reactions for multiple messages at once.
 * Used by ChatWindow to get all reactions in a single subscription.
 */
export const getReactionsForMessages = query({
    args: {
        messageIds: v.array(v.id("messages")),
    },
    handler: async (ctx, args) => {
        const result: Record<string, { emoji: string; count: number; userIds: string[] }[]> = {};

        for (const messageId of args.messageIds) {
            const reactions = await ctx.db
                .query("messageReactions")
                .withIndex("by_message", (q) => q.eq("messageId", messageId))
                .collect();

            const grouped: Record<string, { emoji: string; count: number; userIds: string[] }> = {};
            for (const r of reactions) {
                if (!grouped[r.emoji]) {
                    grouped[r.emoji] = { emoji: r.emoji, count: 0, userIds: [] };
                }
                grouped[r.emoji].count++;
                grouped[r.emoji].userIds.push(r.userId as string);
            }

            result[messageId as string] = Object.values(grouped);
        }

        return result;
    },
});

// ─── toggleReaction ───────────────────────────────────────────────────────────
/**
 * One reaction per user per message (like WhatsApp / Telegram).
 *
 * - Same emoji again → remove it (toggle off).
 * - Different emoji → replace the old one.
 * - No existing reaction → insert new one.
 */
export const toggleReaction = mutation({
    args: {
        messageId: v.id("messages"),
        emoji: v.string(),
    },
    handler: async (ctx, args) => {
        if (!ALLOWED_EMOJIS.includes(args.emoji)) {
            throw new Error(`Invalid emoji. Allowed: ${ALLOWED_EMOJIS.join(" ")}`);
        }

        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const me = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!me) throw new Error("User not found");

        // Find ALL existing reactions by this user on this message
        const existing = await ctx.db
            .query("messageReactions")
            .withIndex("by_user_message", (q) =>
                q.eq("userId", me._id).eq("messageId", args.messageId)
            )
            .collect();

        const sameEmoji = existing.find((r) => r.emoji === args.emoji);

        if (sameEmoji) {
            // Toggle off — user clicked the same emoji they already picked
            await ctx.db.delete(sameEmoji._id);
        } else {
            // Remove any previous reaction first (one reaction per user)
            for (const old of existing) {
                await ctx.db.delete(old._id);
            }
            // Insert the new reaction
            await ctx.db.insert("messageReactions", {
                messageId: args.messageId,
                userId: me._id,
                emoji: args.emoji,
            });
        }
    },
});
