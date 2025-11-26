import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // unchanged
  organizations: defineTable({
    name: v.string(),
    active: v.boolean(),
  }),
  // unchanged
  userConfig: defineTable({
    userId: v.string(),
    organizationId: v.array(v.id("organizations")),
    role: v.union(
      v.literal("admin"),
      v.literal("superAdmin"),
      v.literal("user"),
    ),
  }),
  // unchanged
  qualityFactorsCategory: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
  }).index("by_org", ["organizationId"]),
  // unchanged
  qualityFactors: defineTable({
    qfCategoryId: v.id("qualityFactorsCategory"),
    name: v.string(),
    unit: v.optional(v.string()),
  }).index("by_qfCat", ["qfCategoryId"]),

  // MODIFIED: Renamed from productTypes and added 'type'
  products: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    sku: v.string(),
    type: v.union(
      v.literal("Raw Material"),
      v.literal("Intermediate"),
      v.literal("Finished Good"),
      v.literal("By-product"),
    ),
    baseUnit: v.string(),
    presentation: v.string(),
    equivalence: v.string(),
    averageWeigth: v.string(),
    qualityFactorsId: v.array(v.id("qualityFactors")),
  }).index("by_org", ["organizationId"]),

  // NEW: Defines possible outputs for a given input product
  productOutputDefinitions: defineTable({
    organizationId: v.id("organizations"),
    inputProductId: v.id("products"),
    outputProductId: v.id("products"),
  })
    .index("by_org", ["organizationId"])
    .index("by_input", ["inputProductId"]),

  // unchanged
  warehouse: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    capacity: v.number(),
    baseUnit: v.string(),
    row: v.number(),
  }).index("by_org", ["organizationId"]),

  // NEW: Suppliers
  suppliers: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    details: v.optional(v.string()),
  }).index("by_org", ["organizationId"]),

  // NEW: Customers
  customers: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    details: v.optional(v.string()),
  }).index("by_org", ["organizationId"]),

  // NEW: Purchase Orders
  purchases: defineTable({
    organizationId: v.id("organizations"),
    supplierId: v.optional(v.id("suppliers")),
    orderDate: v.number(),
    status: v.string(), // e.g., "Ordered", "Received"
  }).index("by_org", ["organizationId"]),

  // NEW: The central table for inventory tracking
  inventoryLots: defineTable({
    organizationId: v.id("organizations"),
    productId: v.id("products"),
    warehouseId: v.id("warehouse"),
    lotNumber: v.string(),
    quantity: v.number(),
    vehicleInfo: v.string(),
    unit: v.string(),
    creationDate: v.number(),
    qualityFactorValues: v.optional(v.record(v.string(), v.string())), // NEW FIELD
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

  // NEW: Records a production event
  productionRuns: defineTable({
    organizationId: v.id("organizations"),
    runDate: v.number(),
    inputLotId: v.id("inventoryLots"), // Lot of Raw Material or Intermediate consumed
    quantityConsumed: v.number(),
    notes: v.optional(v.string()),
  }).index("by_org", ["organizationId"]),

  // NEW: Records the outputs of a production run, each creating a new inventoryLot
  productionOutputs: defineTable({
    productionRunId: v.id("productionRuns"),
    productId: v.id("products"), // The product type that was created
    quantityProduced: v.number(),
    // Links to the inventory lot created. Not applicable for "By-product" types.
    resultingInventoryLotId: v.optional(v.id("inventoryLots")),
  }).index("by_run", ["productionRunId"]),

  // NEW: Dispatch/Sales Orders
  dispatches: defineTable({
    organizationId: v.id("organizations"),
    customerId: v.optional(v.id("customers")),
    dispatchDate: v.number(),
    status: v.string(), // e.g., "Pending", "Shipped"
  }).index("by_org", ["organizationId"]),

  // NEW: Tracks which specific lots are dispatched
  dispatchLineItems: defineTable({
    dispatchId: v.id("dispatches"),
    inventoryLotId: v.id("inventoryLots"), // The specific lot being sold
    quantityDispatched: v.number(),
  }).index("by_dispatch", ["dispatchId"]),

  // NEW: Log for every quantity change for full audit trail
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
    quantityChange: v.number(), // positive for increase, negative for decrease
    relatedId: v.optional(v.string()), // e.g., purchaseId, productionRunId, dispatchId
    timestamp: v.number(),
  })
    .index("by_org", ["organizationId"])
    .index("by_lot", ["inventoryLotId"]),
});
