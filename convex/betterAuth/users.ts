import { mutation, query } from "./_generated/server";
import { doc } from "convex-helpers/validators";
import schema from "./schema";
import { v } from "convex/values";

export const getUser = query({
  args: { userId: v.id("user") },
  returns: v.union(v.null(), doc(schema, "user")),
  handler: async (ctx, args) => {
    return ctx.db.get(args.userId);
  },
});

export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("user")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
    return user;
  },
});

export const addUser = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db.insert("user", {
      email: args.email,
      name: "",
      emailVerified: false,
      createdAt: +new Date(),
      updatedAt: +new Date(),
    });
    return user;
  },
});

export const updateUserName = mutation({
  args: { userId: v.id("user"), name: v.string() },
  handler: async (ctx, args) => {
    const { auth } = authComponent.getAuth(ctx);
    const session = await auth.get();
    if (session?.state !== "active") {
      throw new Error("Not authenticated");
    }
    if (session.user.id !== args.userId) {
      throw new Error("Not authorized");
    }
    await ctx.db.patch(args.userId, {
      name: args.name,
      updatedAt: +new Date(),
    });
  },
});
