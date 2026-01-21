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

  products: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    sku: v.string(),
    type: v.union(
      v.literal("Raw Material"),
      v.literal("Finished Good"),
      v.literal("By-product"),
    ),
    baseUnit: v.union(
      v.literal("g"),
      v.literal("kg"),
      v.literal("ton"),
      v.literal("lb"),
      v.literal("oz"),
    ),
    presentation: v.string(),
    equivalence: v.string(),
    averageWeight: v.number(),
    qualityFactorsId: v.array(v.id("qualityFactors")),
  }).index("by_org", ["organizationId"]),

  productOutputDefinitions: defineTable({
    organizationId: v.id("organizations"),
    inputProductId: v.id("products"),
    outputProductId: v.id("products"),
  })
    .index("by_org", ["organizationId"])
    .index("by_input", ["inputProductId"]),

  warehouse: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    capacity: v.number(),
    baseUnit: v.union(
      v.literal("g"),
      v.literal("kg"),
      v.literal("ton"),
      v.literal("lb"),
      v.literal("oz"),
    ),
    row: v.number(),
  }).index("by_org", ["organizationId"]),

  suppliers: defineTable({
    organizationId: v.id("organizations"),
 /**
 * Fetches products filtered by their type.
 */   name: v.string(),
    details: v.optional(v.string()),
  }).index("by_org", ["organizationId"]),
  customers: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    details: v.optional(v.string()),
  }).index("by_org", ["organizationId"]),
  purchases: defineTable({
    organizationId: v.id("organizations"),
    supplierId: v.optional(v.id("suppliers")),
    orderDate: v.number(),
    status: v.string(),
  }).index("by_org", ["organizationId"]),
  inventoryLots: defineTable({
    organizationId: v.id("organizations"),
    productId: v.id("products"),
    warehouseId: v.id("warehouse"),
    lotNumber: v.string(),
    quantity: v.number(),
    vehicleInfo: v.string(),
    creationDate: v.number(),
    qualityFactorValues: v.optional(v.record(v.string(), v.string())),
    source: v.union(
      v.object({
        type: v.literal("purchase"),
        purchaseId: v.id("purchases"),
      }),
      v.object({
        type: v.literal("production"),
        productionRunId: v.id("productionRuns"),
      }),
      v.object({ type: v.literal("manual_adjustment") }),
    ),
  })
    .index("by_org", ["organizationId"])
    .index("by_product", ["productId"])
    .index("by_warehouse", ["warehouseId"]),

  productionRuns: defineTable({
    organizationId: v.id("organizations"),
    runDate: v.number(),
    inputLotId: v.id("inventoryLots"),
    quantityConsumed: v.number(),
    notes: v.optional(v.string()),
  }).index("by_org", ["organizationId"]),

  productionOutputs: defineTable({
    productionRunId: v.id("productionRuns"),
    productId: v.id("products"),
    quantityProduced: v.number(),
    resultingInventoryLotId: v.optional(v.id("inventoryLots")),
  }).index("by_run", ["productionRunId"]),

  lotQuality: defineTable({
    productionOutputId: v.id("productionOutputs"),
    qualityFactorId: v.id("qualityFactors"),
    value: v.string(),
  }).index("by_production_output", ["productionOutputId"]),

  dispatches: defineTable({
    organizationId: v.id("organizations"),
    customerId: v.optional(v.id("customers")),
    dispatchDate: v.number(),
    status: v.string(),
  }).index("by_org", ["organizationId"]),

  dispatchLineItems: defineTable({
    dispatchId: v.id("dispatches"),
    inventoryLotId: v.id("inventoryLots"),
    quantityDispatched: v.number(),
  }).index("by_dispatch", ["dispatchId"]),

  activityLog: defineTable({
    organizationId: v.id("organizations"),
    inventoryLotId: v.id("inventoryLots"),
    activityType: v.union(
      v.literal("reception"),
      v.literal("production_in"),
      v.literal("production_out"),
      v.literal("dispatch"),
      v.literal("adjustment"),
    ),
    quantityChange: v.number(),
    relatedId: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_org", ["organizationId"])
    .index("by_lot", ["inventoryLotId"]),
});
