"use client";
import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Doc, Id } from "../../../../convex/_generated/dataModel";
import { convertFromCanonical } from "@/lib/units";

interface ProductCardProps {
  product: Doc<"products">;
  factorIdToInfo: Map<string, { name: string; categoryName: string }>;
}

export default function ProductCard({
  product,
  factorIdToInfo,
}: ProductCardProps) {
  const possibleOutputs = useQuery(api.products.getPossibleOutputs, {
    inputProductId: product._id,
  });

  const qualityFactors = useMemo(() => {
    const grouped = new Map<string, string[]>();
    const factorIds = (product.qualityFactorsId as unknown as string[]) ?? [];
    for (const id of factorIds) {
      const info = factorIdToInfo.get(id);
      if (!info) continue;
      const arr = grouped.get(info.categoryName) ?? [];
      arr.push(info.name);
      grouped.set(info.categoryName, arr);
    }
    return Array.from(grouped.entries()).sort((a, b) =>
      a[0].localeCompare(b[0]),
    );
  }, [product, factorIdToInfo]);

  return (
    <div className="px-4 pb-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Características</h3>
        <ul className="list-disc pl-6 space-y-1 text-gray text-xs">
          <li>SKU: {product.sku}</li>
          <li>Unidad base: {product.baseUnit}</li>
          {product.presentation && <li>Presentación: {product.presentation}</li>}
          {product.equivalence && <li>Equivalencia: {product.equivalence}</li>}
          {product.averageWeight && <li>Peso promedio: {convertFromCanonical(product.averageWeight, product.baseUnit)}</li>}
        </ul>
      </div>

      <div>
        <h3 className="text-sm font-semibold">Factores de Calidad</h3>
        {qualityFactors.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sin factores de calidad
          </p>
        ) : (
          <ul className="list-disc pl-6 space-y-1 text-gray text-xs">
            {qualityFactors.map(([cat, names]) => (
              <li key={cat}>
                {cat}: {names.join(", ")}
              </li>
            ))}
          </ul>
        )}
      </div>

      {(product.type === "Raw Material" || product.type === "By-product") && (
        <div>
          <h3 className="text-sm font-semibold">Productos resultantes</h3>
          {possibleOutputs && possibleOutputs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No se han definido productos resultantes
            </p>
          ) : (
            <ul className="list-disc pl-6 space-y-1 text-gray text-xs">
                          {possibleOutputs?.map((output) =>
                            output ? (
                              <li key={output._id}>
                                {output.name} | {output.sku}
                              </li>
                            ) : null,
                          )}            </ul>
          )}
        </div>
      )}
    </div>
  );
}
