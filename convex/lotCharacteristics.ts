import type { DatabaseReader } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

export type ProductionCharacteristic = {
  name: string;
  value: string;
};

export async function getProductionCharacteristicsForLot(
  db: DatabaseReader,
  lot: Doc<"inventoryLots"> | null,
): Promise<ProductionCharacteristic[]> {
  if (!lot || lot.source.type !== "production") {
    return [];
  }

  const productionOutput = await db
    .query("productionOutputs")
    .withIndex("by_resulting_inventory_lot", (q) =>
      q.eq("resultingInventoryLotId", lot._id),
    )
    .unique();

  if (!productionOutput) {
    return [];
  }

  const lotQualityRows = await db
    .query("lotQuality")
    .withIndex("by_production_output", (q) =>
      q.eq("productionOutputId", productionOutput._id),
    )
    .collect();

  if (lotQualityRows.length === 0) {
    return [];
  }

  const qualityFactors = await Promise.all(
    lotQualityRows.map(async (lotQualityRow) => {
      const qualityFactor = await db.get(lotQualityRow.qualityFactorId);
      if (!qualityFactor) {
        return null;
      }

      return {
        name: qualityFactor.name,
        value: lotQualityRow.value,
      };
    }),
  );

  return qualityFactors.filter(
    (
      characteristic,
    ): characteristic is ProductionCharacteristic => characteristic !== null,
  );
}
