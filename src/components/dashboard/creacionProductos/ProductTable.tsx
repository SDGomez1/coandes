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
import { Doc, Id } from "../../../../convex/_generated/dataModel";
import ProductCard from "./ProductCard";
import EditProduct from "./EditProduct";

function ProductCategorySection({
  title,
  products,
  factorIdToInfo,
}: {
  title: string;
  products: Doc<"products">[] | undefined;
  factorIdToInfo: Map<string, { name: string; categoryName: string }>;
}) {
  if (!products || products.length === 0) {
    return (
      <div className="w-full py-3 flex justify-center items-center border-t border-neutral-200">
        <p className="text-gray text-xs">
          No hay productos en la categoría: {title}
        </p>
      </div>
    );
  }

  return (
    <Accordion type="multiple" className="w-full">
      {products.map((prod) => (
        <AccordionItem key={prod._id} value={prod._id as string}>
          <div className="flex justify-between">
            <AccordionTrigger className="text-xs font-medium flex-1">
              {prod.name} | {prod.sku}
            </AccordionTrigger>
            <EditProduct product={prod} />
          </div>
          <AccordionContent>
            <ProductCard product={prod} factorIdToInfo={factorIdToInfo} />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export default function ProductTable() {
  const org = useQuery(api.organizations.getOrg);
  const orgId = org?._id as Id<"organizations">;

  const rawMaterials = useQuery(api.products.getProductsByType, {
    organizationId: orgId,
    type: "Raw Material",
  });
  const finishedGoods = useQuery(api.products.getProductsByType, {
    organizationId: orgId,
    type: "Finished Good",
  });
  const byProducts = useQuery(api.products.getProductsByType, {
    organizationId: orgId,
    type: "By-product",
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

  const allProducts = [
    ...(rawMaterials ?? []),
    ...(finishedGoods ?? []),
    ...(byProducts ?? []),
  ];

  if (!allProducts || allProducts.length === 0) {
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
        <AccordionItem value="raw-materials">
          <AccordionTrigger className="font-semibold">
            Materias Primas
          </AccordionTrigger>
          <AccordionContent>
            <ProductCategorySection
              title="Materias Primas"
              products={rawMaterials}
              factorIdToInfo={factorIdToInfo}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="by-products">
          <AccordionTrigger className="font-semibold">
            Subproductos
          </AccordionTrigger>
          <AccordionContent>
            <ProductCategorySection
              title="Subproductos"
              products={byProducts}
              factorIdToInfo={factorIdToInfo}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="finished-goods">
          <AccordionTrigger className="font-semibold">
            Productos Terminados
          </AccordionTrigger>
          <AccordionContent>
            <ProductCategorySection
              title="Productos Terminados"
              products={finishedGoods}
              factorIdToInfo={factorIdToInfo}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
