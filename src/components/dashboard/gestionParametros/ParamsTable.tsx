"use client";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ChevronRight } from "lucide-react";
import EditQualityCategory from "./EditQualityCategory";

export default function ParamsTable() {
  const categoriesWithFactors = useQuery(
    api.qualityFactors.listCategoriesWithFactorsByOrganization,
  );

  if (!categoriesWithFactors || categoriesWithFactors.length <= 0) {
    return (
      <div className="w-full py-6 flex justify-center items-center border border-neutral-200 rounded my-8 shadow">
        <p className="text-gray text-xs">
          Aún no hay parámetros en el catálogo
        </p>
      </div>
    );
  }
  return (
    <div className="w-full py-2 border border-neutral-200 rounded my-8 shadow px-6">
      <Accordion type="multiple" className="w-full">
        {categoriesWithFactors.map((factor) => {
          return (
            <AccordionItem
              key={factor.category._id}
              value={factor.category._id as string}
            >
              <div className="flex justify-between items-center">
                <AccordionTrigger
                  className="text-xs font-medium flex justify-baseline gap-2 items-center cursor-pointer "
                  showChevronIcon={false}
                >
                  <ChevronRight className="size-4 text-primary" />
                  {factor.category.name}
                </AccordionTrigger>
                <EditQualityCategory
                  category={factor.category}
                  factors={factor.factors}
                />
              </div>

              <AccordionContent className="px-4 pb-4">
                {factor.factors.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Sin factores de calidad
                  </p>
                ) : (
                  <ul className="list-disc pl-6 space-y-1 text-gray text-xs">
                    {factor.factors.map((qf) => (
                      <li key={qf._id}>{qf.name} </li>
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
