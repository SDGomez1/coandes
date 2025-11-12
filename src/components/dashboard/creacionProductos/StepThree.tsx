// StepThree.tsx
import { useState } from "react";
import {
  useFieldArray,
  useFormContext,
  ControllerRenderProps,
} from "react-hook-form";
import { DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, X } from "lucide-react";

import { useQuery } from "convex/react";
import type { ProductFormType } from "./CreateNewProduct";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

export default function StepThree() {
  const { control } = useFormContext<ProductFormType>();

  // Convex: categories with factors for current org
  const categories = useQuery(
    api.qualityFactors.listCategoriesWithFactorsByOrganization,
  );

  // Custom parameters (kept from previous behavior)
  const {
    fields: paramFields,
    append: appendParam,
    remove: removeParam,
  } = useFieldArray({
    control,
    name: "qualityParameters",
  });

  const [addingParam, setAddingParam] = useState(false);
  const [newParamName, setNewParamName] = useState("");

  const saveNewParam = () => {
    const name = newParamName.trim();
    if (!name) return;
    appendParam({ name, items: [] });
    setNewParamName("");
    setAddingParam(false);
  };

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

      {/* Custom Parameters (local-only for now) */}
      <div className="mt-8 space-y-3">
        <h3 className="font-medium">Parámetros personalizados</h3>

        {!addingParam ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setAddingParam(true)}
            className="w-fit"
          >
            <Plus className="mr-2 h-4 w-4" />
            Añadir un nuevo parámetro
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Input
              value={newParamName}
              onChange={(e) => setNewParamName(e.target.value)}
              placeholder="Nombre del parámetro (p. ej. Físico-Químicos)"
              className="max-w-md"
            />
            <Button type="button" onClick={saveNewParam}>
              Guardar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setNewParamName("");
                setAddingParam(false);
              }}
            >
              Cancelar
            </Button>
          </div>
        )}

        {paramFields.length > 0 && (
          <Accordion type="multiple" className="w-full">
            {paramFields.map((param, pIndex) => (
              <CustomParameterSection
                key={param.id}
                index={pIndex}
                paramId={param.id}
                onRemove={() => removeParam(pIndex)}
              />
            ))}
          </Accordion>
        )}
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

function CustomParameterSection({
  index,
  paramId,
  onRemove,
}: {
  index: number;
  paramId: string;
  onRemove: () => void;
}) {
  const { control, watch } = useFormContext<ProductFormType>();
  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({
    control,
    name: `qualityParameters.${index}.items`,
  });

  const [addingItem, setAddingItem] = useState(false);
  const [newItemLabel, setNewItemLabel] = useState("");

  const paramName = watch(`qualityParameters.${index}.name`);

  const saveNewItem = () => {
    const label = newItemLabel.trim();
    if (!label) return;
    appendItem({ label, selected: false });
    setNewItemLabel("");
    setAddingItem(false);
  };

  return (
    <AccordionItem value={paramId} className="border rounded">
      <div className="flex items-center justify-between pr-2">
        <AccordionTrigger className="text-left px-4">
          {paramName || "Parámetro"}
        </AccordionTrigger>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="text-red-500"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <AccordionContent className="px-4 pb-4">
        {!addingItem ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setAddingItem(true)}
            className="my-2"
          >
            <Plus className="mr-2 h-4 w-4" />
            Añadir item
          </Button>
        ) : (
          <div className="flex items-center gap-2 my-2">
            <Input
              value={newItemLabel}
              onChange={(e) => setNewItemLabel(e.target.value)}
              placeholder='Nombre del item (p. ej. "% Humedad")'
              className="max-w-md"
            />
            <Button type="button" onClick={saveNewItem}>
              Guardar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setNewItemLabel("");
                setAddingItem(false);
              }}
            >
              Cancelar
            </Button>
          </div>
        )}

        <div className="mt-2 grid grid-cols-1 gap-3">
          {itemFields.map((item, iIndex) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded border p-3"
            >
              <FormField
                control={control}
                name={`qualityParameters.${index}.items.${iIndex}.selected`}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-3 m-0">
                    <FormControl>
                      <Checkbox
                        checked={!!field.value}
                        onCheckedChange={(checked) => field.onChange(!!checked)}
                      />
                    </FormControl>
                    <FormLabel className="m-0">
                      {
                        watch(
                          `qualityParameters.${index}.items.${iIndex}.label`,
                        ) as string
                      }
                    </FormLabel>
                  </FormItem>
                )}
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeItem(iIndex)}
                className="text-red-500"
                title="Eliminar item"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
