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

export const editProductionOutputEntry = mutation({
  args: {
    productionRunId: v.id("productionRuns"),
    productionOutputId: v.id("productionOutputs"),
    quantityConsumed: v.number(),
    quantityProduced: v.number(),
    lotNumber: v.string(),
    warehouseId: v.id("warehouse"),
  },
  handler: async (ctx, args) => {
    if (args.quantityConsumed <= 0 || args.quantityProduced <= 0) {
      throw new Error("Quantities must be greater than zero.");
    }
    if (!args.lotNumber.trim()) {
      throw new Error("Lot number is required.");
    }

    const run = await ctx.db.get(args.productionRunId);
    if (!run) throw new Error("Production run not found.");

    const output = await ctx.db.get(args.productionOutputId);
    if (!output) throw new Error("Production output not found.");
    if (output.productionRunId !== run._id) {
      throw new Error("Production output does not belong to this run.");
    }

    if (!output.resultingInventoryLotId) {
      throw new Error("Resulting inventory lot not found.");
    }

    const inputLot = await ctx.db.get(run.inputLotId);
    const outputLot = await ctx.db.get(output.resultingInventoryLotId);
    if (!inputLot || !outputLot) {
      throw new Error("Related inventory lot not found.");
    }

    const availableInputBeforeRun = inputLot.quantity + run.quantityConsumed;
    if (args.quantityConsumed > availableInputBeforeRun) {
      throw new Error(
        `Insufficient input lot quantity. Available: ${availableInputBeforeRun}, Required: ${args.quantityConsumed}`,
      );
    }

    const targetWarehouse = await ctx.db.get(args.warehouseId);
    if (!targetWarehouse) {
      throw new Error("Warehouse not found.");
    }
    if (targetWarehouse.organizationId !== run.organizationId) {
      throw new Error("Warehouse does not belong to this organization.");
    }

    const duplicateLot = await ctx.db
      .query("inventoryLots")
      .withIndex("by_org", (q) => q.eq("organizationId", run.organizationId))
      .filter((q) =>
        q.and(
          q.eq(q.field("lotNumber"), args.lotNumber),
          q.neq(q.field("_id"), outputLot._id),
        ),
      )
      .first();

    if (duplicateLot) {
      throw new Error(`Lot number ${args.lotNumber} already exists.`);
    }

    const usedCapacity = await getUsedWarehouseCapacity(
      ctx,
      args.warehouseId,
      outputLot._id,
    );
    if (usedCapacity + args.quantityProduced > targetWarehouse.capacity) {
      throw new Error("Insufficient warehouse capacity for the edited lot.");
    }

    await ctx.db.patch(run.inputLotId, {
      quantity: availableInputBeforeRun - args.quantityConsumed,
    });
    await ctx.db.patch(run._id, {
      quantityConsumed: args.quantityConsumed,
    });

    await ctx.db.patch(outputLot._id, {
      warehouseId: args.warehouseId,
      lotNumber: args.lotNumber,
      quantity: args.quantityProduced,
    });

    await ctx.db.patch(output._id, {
      quantityProduced: args.quantityProduced,
    });

    const inputDelta = run.quantityConsumed - args.quantityConsumed;
    if (inputDelta !== 0) {
      await ctx.db.insert("activityLog", {
        organizationId: run.organizationId,
        inventoryLotId: run.inputLotId,
        activityType: "adjustment",
        quantityChange: inputDelta,
        relatedId: run._id,
        timestamp: Date.now(),
      });
    }

    const outputDelta = args.quantityProduced - output.quantityProduced;
    if (outputDelta !== 0) {
      await ctx.db.insert("activityLog", {
        organizationId: run.organizationId,
        inventoryLotId: outputLot._id,
        activityType: "adjustment",
        quantityChange: outputDelta,
        relatedId: run._id,
        timestamp: Date.now(),
      });
    }
  },
});

export const addOutputsToProductionRun = mutation({
  args: {
    productionRunId: v.id("productionRuns"),
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
    const run = await ctx.db.get(args.productionRunId);
    if (!run) {
      throw new Error("Production run not found.");
    }

    for (const output of args.outputs) {
      if (output.quantityProduced <= 0) {
        throw new Error("Produced quantity must be greater than zero.");
      }
      if (!output.lotNumber.trim()) {
        throw new Error("Output lot number is required.");
      }

      const product = await ctx.db.get(output.productId);
      if (!product) {
        throw new Error(`Product with id ${output.productId} not found`);
      }

      const warehouse = await ctx.db.get(output.warehouseId);
      if (!warehouse || warehouse.organizationId !== run.organizationId) {
        throw new Error("Warehouse not found or access denied.");
      }

      const existingLot = await ctx.db
        .query("inventoryLots")
        .withIndex("by_org", (q) => q.eq("organizationId", run.organizationId))
        .filter((q) => q.eq(q.field("lotNumber"), output.lotNumber))
        .first();
      if (existingLot) {
        throw new Error(`Output lot number ${output.lotNumber} already exists.`);
      }

      const resultingInventoryLotId = await ctx.db.insert("inventoryLots", {
        organizationId: run.organizationId,
        productId: output.productId,
        warehouseId: output.warehouseId,
        lotNumber: output.lotNumber,
        quantity: output.quantityProduced,
        creationDate: Date.now(),
        source: {
          type: "production",
          productionRunId: run._id,
        },
        vehicleInfo: "",
      });

      await ctx.db.insert("activityLog", {
        organizationId: run.organizationId,
        inventoryLotId: resultingInventoryLotId,
        activityType: "production_in",
        quantityChange: output.quantityProduced,
        relatedId: run._id,
        timestamp: Date.now(),
      });

      const outputId = await ctx.db.insert("productionOutputs", {
        productionRunId: run._id,
        productId: output.productId,
        quantityProduced: output.quantityProduced,
        resultingInventoryLotId,
      });

      for (const qf of output.qualityFactors) {
        await ctx.db.insert("lotQuality", {
          productionOutputId: outputId,
          qualityFactorId: qf.factorId,
          value: qf.value,
        });
      }
    }
  },
});

export const getProductionRunsForOutput = query({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const runs = await ctx.db
      .query("productionRuns")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .order("desc")
      .collect();

    return await Promise.all(
      runs.map(async (run) => {
        const inputLot = await ctx.db.get(run.inputLotId);
        const product = inputLot ? await ctx.db.get(inputLot.productId) : null;
        const outputs = await ctx.db
          .query("productionOutputs")
          .withIndex("by_run", (q) => q.eq("productionRunId", run._id))
          .collect();
        return {
          _id: run._id,
          runDate: run.runDate,
          inputLotNumber: inputLot?.lotNumber ?? "N/A",
          inputProductName: product?.name ?? "N/A",
          inputProductId: inputLot?.productId,
          quantityConsumed: run.quantityConsumed,
          outputsCount: outputs.length,
        };
      }),
    );
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
              _id: output._id,
              productName: product?.name ?? "N/A",
              productId: output.productId,
              quantityProduced: output.quantityProduced,
              resultingInventoryLotId: output.resultingInventoryLotId,
              warehouseId: lot?.warehouseId,
              newLotNumber: lot?.lotNumber ?? "N/A (By-product)",
              unit: product?.baseUnit ?? "",
              qualityFactors: qualityFactorsWithNames,
            };
          }),
        );

        return {
          _id: run._id,
          inputLotId: run.inputLotId,
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

async function getUsedWarehouseCapacity(
  ctx: any,
  warehouseId: any,
  excludeLotId: any,
) {
  const lots = await ctx.db
    .query("inventoryLots")
    .withIndex("by_warehouse", (q: any) => q.eq("warehouseId", warehouseId))
    .filter((q: any) => q.gt(q.field("quantity"), 0))
    .collect();

  return lots.reduce((sum: number, current: any) => {
    if (current._id === excludeLotId) return sum;
    return sum + current.quantity;
  }, 0);
}

export const getProductionVolume = query({
    args: {
        organizationId: v.id("organizations"),
    },
    handler: async (ctx, args) => {
        const production = await ctx.db
            .query("productionOutputs")
            .collect();
        
        const data = new Map<string, number>();

        for(const p of production) {
            const run = await ctx.db.get(p.productionRunId);
            if(run?.organizationId === args.organizationId) {
                const date = new Date(run.runDate);
                const key = `${date.getFullYear()}-${date.getMonth()}`;
                const current = data.get(key) ?? 0;
                data.set(key, current + p.quantityProduced);
            }
        }

        return Array.from(data.entries()).map(([date, value]) => {
            const [year, month] = date.split('-');
            return {
                name: new Date(Number(year), Number(month)).toLocaleString('default', { month: 'short' }),
                value,
            }
        });
    }
});
