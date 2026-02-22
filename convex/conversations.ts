import { query } from "./_generated/server";

/**
 * getConversations — fetch all conversations from the database.
 * Later: filter by current user's participantIds.
 */
export const getConversations = query({
    args: {},
    handler: async (ctx) => {
        const conversations = await ctx.db.query("conversations").collect();
        return conversations;
    },
});
