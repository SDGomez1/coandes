import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  organizations: defineTable({
    name: v.string(),
    active: v.boolean(),
  }),
  userConfig: defineTable({
    userId: v.string(),
    organizationId: v.array(v.id("organizations")),
    role: v.union(
      v.literal("admin"),
      v.literal("superAdmin"),
      v.literal("user"),
    ),
  }),
  qualityFactorsCategory: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
  }).index("by_org", ["organizationId"]),
  qualityFactors: defineTable({
    qfCategoryId: v.id("qualityFactorsCategory"),
    name: v.string(),
    unit: v.optional(v.string()),
  }).index("by_qfCat", ["qfCategoryId"]),

  productTypes: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    sku: v.string(),
    baseUnit: v.string(),
    presentation: v.string(),
    equivalence: v.string(),
    averageWeigth: v.string(),
    qualityFactorsId: v.array(v.id("qualityFactors")),
  }).index("by_org", ["organizationId"]),
  warehouse: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    capacity: v.number(),
    baseUnit: v.string(),
    row: v.number(),
  }).index("by_org", ["organizationId"]),
});
