import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ─── upsertUser ───────────────────────────────────────────────────────────────
export const upsertUser = mutation({
    args: {
        clerkId: v.string(),
        name: v.string(),
        email: v.string(),
        imageUrl: v.string(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, {
                name: args.name,
                imageUrl: args.imageUrl,
            });
            return existing._id;
        }

        return await ctx.db.insert("users", {
            clerkId: args.clerkId,
            name: args.name,
            email: args.email,
            imageUrl: args.imageUrl,
            isOnline: false,
        });
    },
});

// ─── getCurrentUser ───────────────────────────────────────────────────────────
export const getCurrentUser = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        return await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
    },
});

// ─── listUsersExceptMe ────────────────────────────────────────────────────────
/**
 * Returns all users except the current one, sorted alphabetically by name.
 * Used for the user discovery / search panel.
 */
export const listUsersExceptMe = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const allUsers = await ctx.db.query("users").collect();

        return allUsers
            .filter((u) => u.clerkId !== identity.subject)
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((u) => ({
                id: u._id,
                name: u.name,
                imageUrl: u.imageUrl,
                isOnline: u.isOnline ?? false,
            }));
    },
});

/**
 * debugAuth — returns the Clerk identity as Convex sees it.
 * If this returns null → JWT template is not configured.
 * If this returns an object → auth is working, check user count in listUsersExceptMe.
 * DELETE THIS before production.
 */
export const debugAuth = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        const allUsers = await ctx.db.query("users").collect();
        return {
            identity: identity ? { subject: identity.subject, name: identity.name } : null,
            totalUsersInDB: allUsers.length,
            users: allUsers.map((u) => ({ name: u.name, clerkId: u.clerkId })),
        };
    },
});
