import { useFormContext } from "react-hook-form";
import { DialogTitle } from "@/components/ui/dialog";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";

import { useQuery } from "convex/react";
import type { ProductFormType } from "./CreateNewProduct";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

export default function StepThree() {
  const categories = useQuery(
    api.qualityFactors.listCategoriesWithFactorsByOrganization,
  );

  return (
    <>
      <DialogTitle className="mt-7 font-semibold text-lg">
        Parámetros de calidad
      </DialogTitle>
      <p className="text-gray-ligth mt-4">
        Seleccione los factores existentes o añada parámetros personalizados.
      </p>

      {/* Existing Quality Factors (from Convex) */}
      <div className="mt-6 space-y-3">
        <h3 className="font-medium">Factores disponibles</h3>
        <Accordion type="multiple" className="w-full">
          {categories === undefined ? (
            <div className="text-sm text-muted-foreground px-2 py-3">
              Cargando categorías...
            </div>
          ) : categories.length === 0 ? (
            <div className="text-sm text-muted-foreground px-2 py-3">
              No hay categorías de factores.
            </div>
          ) : (
            categories.map(({ category, factors }) => (
              <AccordionItem key={category._id} value={category._id}>
                <AccordionTrigger className="px-4">
                  {category.name}
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="grid gap-3">
                    {factors.map((factor) => (
                      <QualityFactorCheckbox
                        key={factor._id}
                        factorId={factor._id}
                        label={
                          factor.unit
                            ? `${factor.name} ${factor.unit}`
                            : factor.name
                        }
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))
          )}
        </Accordion>
      </div>
    </>
  );
}

function QualityFactorCheckbox({
  factorId,
  label,
}: {
  factorId: Id<"qualityFactors">;
  label: string;
}) {
  const { control } = useFormContext<ProductFormType>();
  const idStr = factorId as unknown as string;

  return (
    <FormField
      control={control}
      name="qualityFactorsId"
      render={({ field }) => {
        const value = (field.value || []) as string[];
        const checked = value.includes(idStr);

        const toggle = (next: boolean) => {
          if (next) {
            const nextArr = Array.from(new Set([...value, idStr]));
            field.onChange(nextArr);
          } else {
            field.onChange(value.filter((v) => v !== idStr));
          }
        };

        return (
          <FormItem className="flex flex-row items-center gap-3 m-0">
            <FormControl>
              <Checkbox
                checked={checked}
                onCheckedChange={(v) => toggle(!!v)}
              />
            </FormControl>
            <FormLabel className="m-0">{label}</FormLabel>
          </FormItem>
        );
      }}
    />
  );
}
