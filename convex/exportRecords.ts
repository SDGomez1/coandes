import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createExportRecord = mutation({
  args: {
    organizationId: v.id("organizations"),
    module: v.string(),
    fileName: v.string(),
    format: v.union(v.literal("csv"), v.literal("excel")),
    mimeType: v.string(),
    storageId: v.id("_storage"),
    rowCount: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7;

    const recordId = await ctx.db.insert("exportRecords", {
      organizationId: args.organizationId,
      module: args.module,
      fileName: args.fileName,
      format: args.format,
      mimeType: args.mimeType,
      storageId: args.storageId,
      rowCount: args.rowCount,
      createdBy: identity?.subject,
      createdAt: Date.now(),
      expiresAt,
    });

    const downloadUrl = await ctx.storage.getUrl(args.storageId);
    return { recordId, downloadUrl };
  },
});

export const generateExportUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getExportHistory = query({
  args: {
    organizationId: v.id("organizations"),
    format: v.optional(v.union(v.literal("csv"), v.literal("excel"))),
  },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query("exportRecords")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    const filtered = args.format
      ? records.filter((record) => record.format === args.format)
      : records;

    const sorted = filtered.sort((a, b) => b.createdAt - a.createdAt);

    return await Promise.all(
      sorted.map(async (record) => ({
        ...record,
        downloadUrl: await ctx.storage.getUrl(record.storageId),
      })),
    );
  },
});

export const deleteExportRecord = mutation({
  args: {
    exportRecordId: v.id("exportRecords"),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.exportRecordId);
    if (!record) {
      return;
    }

    await ctx.storage.delete(record.storageId);
    await ctx.db.delete(args.exportRecordId);
  },
});
