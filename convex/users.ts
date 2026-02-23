import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/** A user is "online" if their lastSeen was within the last 30 seconds. */
const ONLINE_THRESHOLD_MS = 30_000;
function computeIsOnline(lastSeen?: number): boolean {
    if (!lastSeen) return false;
    return Date.now() - lastSeen < ONLINE_THRESHOLD_MS;
}

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

        const now = Date.now();

        if (existing) {
            await ctx.db.patch(existing._id, {
                name: args.name,
                imageUrl: args.imageUrl,
                lastSeen: now,
                isOnline: true,
            });
            return existing._id;
        }

        return await ctx.db.insert("users", {
            clerkId: args.clerkId,
            name: args.name,
            email: args.email,
            imageUrl: args.imageUrl,
            isOnline: true,
            lastSeen: now,
        });
    },
});

// ─── updatePresence ───────────────────────────────────────────────────────────
/**
 * Heartbeat mutation — called every 10 s from the client.
 * Updates lastSeen to now.
 */
export const updatePresence = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return;

        const me = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!me) return;

        await ctx.db.patch(me._id, {
            lastSeen: Date.now(),
            isOnline: true,
        });
    },
});

// ─── setOffline ───────────────────────────────────────────────────────────────
/**
 * Called on tab close / visibility-hidden. Sets lastSeen to epoch-start
 * so all subscribers see the user as offline INSTANTLY via Convex push.
 */
export const setOffline = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return;

        const me = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!me) return;

        await ctx.db.patch(me._id, {
            lastSeen: 1, // epoch start → always > 30 s ago → offline
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

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) return null;
        return { ...user, isOnline: computeIsOnline(user.lastSeen) };
    },
});

// ─── listUsersExceptMe ────────────────────────────────────────────────────────
/**
 * Returns all users except the current one, sorted alphabetically.
 * isOnline is computed from lastSeen so it's always fresh when the query re-runs.
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
                isOnline: computeIsOnline(u.lastSeen),
                lastSeen: u.lastSeen ?? 0,
            }));
    },
});

/**
 * debugAuth — returns the Clerk identity as Convex sees it.
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
            users: allUsers.map((u) => ({ name: u.name, clerkId: u.clerkId, lastSeen: u.lastSeen })),
        };
    },
});
