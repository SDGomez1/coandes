"use client";
import { useMemo } from "react";
import { useQuery } from "convex/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

export default function ProductTable() {
  const org = useQuery(api.organizations.getOrg);
  const products = useQuery(api.products.getProducts, {
    organizationId: org?._id as Id<"organizations">,
  });

  const categoriesWithFactors = useQuery(
    api.qualityFactors.listCategoriesWithFactorsByOrganization,
  );

  const factorIdToInfo = useMemo(() => {
    const map = new Map<string, { name: string; categoryName: string }>();
    if (!categoriesWithFactors) return map;
    for (const { category, factors } of categoriesWithFactors) {
      for (const f of factors) {
        map.set(f._id as unknown as string, {
          name: f.name,
          categoryName: category.name,
        });
      }
    }
    return map;
  }, [categoriesWithFactors]);

  if (!products || products.length === 0) {
    return (
      <div className="w-full py-6 flex justify-center items-center border border-neutral-200 rounded my-8 shadow">
        <p className="text-gray text-xs">Aún no hay productos en el catálogo</p>
      </div>
    );
  }

  return (
    <div className="w-full py-6  border border-neutral-200 rounded my-8 shadow px-6">
      <h2 className="font-semibold text-lg">Catálogo de productos</h2>
      <Accordion type="multiple" className="w-full">
        {products.map((prod) => {
          const grouped = new Map<string, string[]>();
          const factorIds =
            (prod.qualityFactorsId as unknown as string[]) ?? [];
          for (const id of factorIds) {
            const info = factorIdToInfo.get(id);
            if (!info) continue;
            const arr = grouped.get(info.categoryName) ?? [];
            arr.push(info.name);
            grouped.set(info.categoryName, arr);
          }

          const rows = Array.from(grouped.entries()).sort((a, b) =>
            a[0].localeCompare(b[0]),
          );

          return (
            <AccordionItem key={prod._id} value={prod._id as string}>
              <AccordionTrigger className="text-xs font-medium">
                {prod.name} | {prod.sku}
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                {rows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Sin factores de calidad
                  </p>
                ) : (
                  <ul className="list-disc pl-6 space-y-1 text-gray text-xs">
                    {rows.map(([cat, names]) => (
                      <li key={cat}>
                        {cat}: {names.join(", ")}
                      </li>
                    ))}
                  </ul>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
