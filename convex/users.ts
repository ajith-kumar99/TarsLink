import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * upsertUser — called on every login/signup to sync Clerk identity to Convex.
 * Creates the user if new, updates name/image if they changed.
 */
export const upsertUser = mutation({
    args: {
        clerkId: v.string(),
        name: v.string(),
        email: v.string(),
        imageUrl: v.string(),
    },
    handler: async (ctx, args) => {
        // Check if user already exists
        const existing = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .unique();

        if (existing) {
            // Update name/image in case they changed in Clerk
            await ctx.db.patch(existing._id, {
                name: args.name,
                imageUrl: args.imageUrl,
            });
            return existing._id;
        }

        // New user — insert into DB
        const userId = await ctx.db.insert("users", {
            clerkId: args.clerkId,
            name: args.name,
            email: args.email,
            imageUrl: args.imageUrl,
            isOnline: false,
        });
        return userId;
    },
});

/**
 * getCurrentUser — returns the Convex user record for the signed-in Clerk user.
 */
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

/**
 * listUsers — all users except the currently signed-in one.
 * Used for the user-search / discovery panel.
 */
export const listUsers = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const allUsers = await ctx.db.query("users").collect();
        return allUsers.filter((u) => u.clerkId !== identity.subject);
    },
});
