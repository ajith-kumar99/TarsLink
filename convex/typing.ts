import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const TYPING_EXPIRY_MS = 2000;

// ─── setTyping ────────────────────────────────────────────────────────────────
/**
 * Upserts a typing record with expiresAt = now + 2 s.
 * Called on every keystroke (throttled on the client to ~500 ms).
 */
export const setTyping = mutation({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return;

        const me = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!me) return;

        const expiresAt = Date.now() + TYPING_EXPIRY_MS;

        const existing = await ctx.db
            .query("typing")
            .withIndex("by_user_conversation", (q) =>
                q.eq("userId", me._id).eq("conversationId", args.conversationId)
            )
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, { expiresAt });
        } else {
            await ctx.db.insert("typing", {
                userId: me._id,
                conversationId: args.conversationId,
                userName: me.name,
                expiresAt,
            });
        }
    },
});

// ─── getTypingUsers ───────────────────────────────────────────────────────────
/**
 * Returns ALL typing records for a conversation (excluding the caller).
 * The client filters by expiresAt > Date.now() and sets a timer to re-render
 * when the earliest one expires — this avoids needing server-side timers.
 */
export const getTypingUsers = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const me = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        const records = await ctx.db
            .query("typing")
            .withIndex("by_conversation", (q) =>
                q.eq("conversationId", args.conversationId)
            )
            .collect();

        // Exclude self — client will filter expired ones
        return records
            .filter((r) => String(r.userId) !== String(me?._id))
            .map((r) => ({ userId: r.userId as string, userName: r.userName, expiresAt: r.expiresAt }));
    },
});
