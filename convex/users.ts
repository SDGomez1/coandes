import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";
import { components } from "./_generated/api";

export const byOrganization = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, { organizationId }) => {
    const userConfigs = await ctx.db.query("userConfig").collect();

    const organizationUserConfigs = userConfigs.filter((uc) =>
      uc.organizationId.includes(organizationId),
    );

    const users = await Promise.all(
      organizationUserConfigs.map(async (uc) => {
        const user = await ctx.runQuery(components.betterAuth.users.getUser, {
          userId: uc.userId,
        });
        return {
          ...user,
          role: uc.role,
          userConfigId: uc._id,
        };
      }),
    );

    return users;
  },
});

export const removeUserFromOrganization = mutation({
  args: {
    userConfigId: v.id("userConfig"),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, { userConfigId, organizationId }) => {
    const userConfig = await ctx.db.get(userConfigId);
    if (userConfig) {
      await ctx.db.delete(userConfigId);
    }
  },
});

export const addUserToOrganization = mutation({
  args: {
    email: v.string(),
    organizationId: v.id("organizations"),
    role: v.union(
      v.literal("admin"),
      v.literal("superAdmin"),
      v.literal("user"),
    ),
  },
  handler: async (ctx, args) => {
    let id = "";
    const existingUser = await ctx.runQuery(
      components.betterAuth.users.getUserByEmail,
      {
        email: args.email,
      },
    );
    if (existingUser) {
      id = existingUser._id;
    } else {
      const user = await ctx.runMutation(components.betterAuth.users.addUser, {
        email: args.email,
      });
      if (!user) {
        return;
      }
      id = user;
    }

    const actualConfig = await ctx.db
      .query("userConfig")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), id),
          q.eq(q.field("organizationId"), args.organizationId),
        ),
      )
      .first();
    if (!actualConfig) {
      return await ctx.db.insert("userConfig", {
        userId: id,
        organizationId: args.organizationId,
        role: args.role,
      });
    } else {
      return;
    }
  },
});

export const userExistsByEmail = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.runQuery(
      components.betterAuth.users.getUserByEmail,
      {
        email: args.email,
      },
    );
    return Boolean(existingUser);
  },
});

export const updateUserConfig = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.runQuery(
      components.betterAuth.users.getUser,
      {
        userId: args.userId,
      },
    );
    if (!existingUser) {
      return;
    }

    ctx.runMutation(components.betterAuth.users.updateUserName, {
      userId: args.userId,
      name: args.name,
    });

    return true;
  },
});
