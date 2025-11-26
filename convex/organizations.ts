import { query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Fetches the active organization for the current user.
 * This function assumes a single active organization per user for simplicity,
 * or retrieves based on some session context.
 *
 * NOTE: The logic to determine the 'current user' and their 'active organization'
 * needs to be implemented based on your authentication system (e.g., Clerk).
 * For this example, we will assume a placeholder or a simple query for *an* organization.
 *
 * @returns The active organization document.
 */
export const getOrg = query({
  args: {},
  handler: async (ctx) => {
    // TODO: Implement logic to get the current user's organizationId.
    // This might involve ctx.auth.getUserIdentity() and then looking up userConfig.
    // For now, returning the first organization found. This needs to be robust.

    const organizations = await ctx.db.query("organizations").take(1); // Get the first organization

    if (organizations.length === 0) {
      return null;
    }

    return organizations[0];
  },
});