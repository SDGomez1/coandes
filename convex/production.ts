import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const createProductionRun = mutation({
  args: {
    organizationId: v.id("organizations"),
    inputLotId: v.id("inventoryLots"),
    quantityConsumed: v.number(),
    notes: v.optional(v.string()),
    outputs: v.array(
      v.object({
        productId: v.id("products"),
        quantityProduced: v.number(),
        lotNumber: v.string(),
        warehouseId: v.id("warehouse"),
        qualityFactors: v.array(
          v.object({
            factorId: v.id("qualityFactors"),
            value: v.string(),
          }),
        ),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const inputLot = await ctx.db.get(args.inputLotId);
    if (!inputLot) {
      throw new Error("Input inventory lot not found.");
    }
    if (inputLot.organizationId !== args.organizationId) {
      throw new Error("Access denied to input lot.");
    }
    if (inputLot.quantity < args.quantityConsumed) {
      throw new Error(
        `Insufficient quantity. Available: ${inputLot.quantity}, Required: ${args.quantityConsumed}`,
      );
    }
    for (const output of args.outputs) {
      const product = await ctx.db.get(output.productId);
      if (!product) {
        throw new Error(`Product with id ${output.productId} not found`);
      }
      if (output.lotNumber) {
        const existingLot = await ctx.db
          .query("inventoryLots")
          .withIndex("by_org", (q) =>
            q.eq("organizationId", args.organizationId),
          )
          .filter((q) => q.eq(q.field("lotNumber"), output.lotNumber))
          .first();
        if (existingLot) {
          throw new Error(
            `Output lot number ${output.lotNumber} already exists.`,
          );
        }
      }
    }

    const productionRunId = await ctx.db.insert("productionRuns", {
      organizationId: args.organizationId,
      runDate: Date.now(),
      inputLotId: args.inputLotId,
      quantityConsumed: args.quantityConsumed,
      notes: args.notes,
    });

    await ctx.db.patch(args.inputLotId, {
      quantity: inputLot.quantity - args.quantityConsumed,
    });

    await ctx.db.insert("activityLog", {
      organizationId: args.organizationId,
      inventoryLotId: args.inputLotId,
      activityType: "production_out",
      quantityChange: -args.quantityConsumed,
      relatedId: productionRunId,
      timestamp: Date.now(),
    });

    // 6. Process all outputs
    for (const output of args.outputs) {
      const product = await ctx.db.get(output.productId);
      if (!product) {
        throw new Error(`Product with id ${output.productId} not found`);
      }

      let resultingInventoryLotId: Id<"inventoryLots"> | undefined = undefined;

      resultingInventoryLotId = await ctx.db.insert("inventoryLots", {
        organizationId: args.organizationId,
        productId: output.productId,
        warehouseId: output.warehouseId,
        lotNumber: output.lotNumber,
        quantity: output.quantityProduced,
        creationDate: Date.now(),
        source: {
          type: "production",
          productionRunId: productionRunId,
        },
        vehicleInfo: "",
      });

      // Log the creation of the new lot
      await ctx.db.insert("activityLog", {
        organizationId: args.organizationId,
        inventoryLotId: resultingInventoryLotId,
        activityType: "production_in",
        quantityChange: output.quantityProduced,
        relatedId: productionRunId,
        timestamp: Date.now(),
      });

      const outputId = await ctx.db.insert("productionOutputs", {
        productionRunId: productionRunId,
        productId: output.productId,
        quantityProduced: output.quantityProduced,
        resultingInventoryLotId: resultingInventoryLotId,
      });

      if (output.qualityFactors && output.qualityFactors.length > 0) {
        for (const qf of output.qualityFactors) {
          await ctx.db.insert("lotQuality", {
            productionOutputId: outputId,
            qualityFactorId: qf.factorId,
            value: qf.value,
          });
        }
      }
    }

    return productionRunId;
  },
});

/**
 * Fetches a history of all production runs.
 */
export const getProductionHistory = query({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const runs = await ctx.db
      .query("productionRuns")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .order("desc")
      .collect();

    const history = await Promise.all(
      runs.map(async (run) => {
        const inputLot = await ctx.db.get(run.inputLotId);
        const inputProduct = inputLot
          ? await ctx.db.get(inputLot.productId)
          : null;

        const outputs = await ctx.db
          .query("productionOutputs")
          .withIndex("by_run", (q) => q.eq("productionRunId", run._id))
          .collect();

        const outputDetails = await Promise.all(
          outputs.map(async (output) => {
            const product = await ctx.db.get(output.productId);
            const lot = output.resultingInventoryLotId
              ? await ctx.db.get(output.resultingInventoryLotId)
              : null;

            const qualityFactors = await ctx.db
              .query("lotQuality")
              .withIndex("by_production_output", (q) =>
                q.eq("productionOutputId", output._id),
              )
              .collect();

            const qualityFactorsWithNames = await Promise.all(
              qualityFactors.map(async (qf) => {
                const factor = await ctx.db.get(qf.qualityFactorId);
                return {
                  name: factor?.name ?? "N/A",
                  value: qf.value,
                };
              }),
            );

            return {
              productName: product?.name ?? "N/A",
              quantityProduced: output.quantityProduced,
              newLotNumber: lot?.lotNumber ?? "N/A (By-product)",
              unit: product?.baseUnit ?? "",
              qualityFactors: qualityFactorsWithNames,
            };
          }),
        );

        return {
          _id: run._id,
          runDate: run.runDate,
          inputProductName: inputProduct?.name ?? "N/A",
          inputLotNumber: inputLot?.lotNumber ?? "N/A",
          quantityConsumed: run.quantityConsumed,
          inputUnit: inputProduct?.baseUnit ?? "",
          outputs: outputDetails,
        };
      }),
    );

    return history;
  },
});
