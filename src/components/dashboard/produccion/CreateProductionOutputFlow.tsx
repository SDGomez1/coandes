"use client";

import { useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/assets/icons/LoadingSpinner";
import { PlusIcon } from "lucide-react";
import { convertToCanonical } from "@/lib/units";

const outputSchema = z.object({
  productId: z.string().min(1),
  quantityProduced: z.number().positive(),
  lotNumber: z.string().min(1, "El número de lote es obligatorio."),
  warehouseId: z.string().min(1, "Debe seleccionar una bodega."),
  qualityFactors: z.array(
    z.object({
      factorId: z.string(),
      value: z.string(),
    }),
  ),
});

const formSchema = z.object({
  productionRunId: z.string().min(1, "Debe seleccionar una entrada de producción."),
  outputs: z.array(outputSchema).min(1, "Debe agregar al menos una salida."),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateProductionOutputFlow() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const organization = useQuery(api.organizations.getOrg);
  const orgId = organization?._id;

  const warehouses = useQuery(api.warehouse.getAvailableWarehouse);
  const productionRuns = useQuery(
    (api as any).production.getProductionRunsForOutput,
    orgId ? { organizationId: orgId } : "skip",
  ) as
    | Array<{
        _id: Id<"productionRuns">;
        inputProductId?: Id<"products">;
        inputProductName: string;
        inputLotNumber: string;
        runDate: number;
      }>
    | undefined;

  const addOutputsToProductionRun = useMutation(
    (api as any).production.addOutputsToProductionRun,
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productionRunId: "",
      outputs: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "outputs",
  });

  const selectedRunId = useWatch({
    control: form.control,
    name: "productionRunId",
  });

  const selectedRun = (productionRuns ?? []).find((run) => run._id === selectedRunId);

  const possibleOutputs = useQuery(
    api.products.getPossibleOutputs,
    selectedRun?.inputProductId
      ? { inputProductId: selectedRun.inputProductId }
      : "skip",
  );

  const handleAddOutput = () => {
    if (!possibleOutputs || possibleOutputs.length === 0) {
      toast.error("No hay productos de salida configurados para esta entrada.");
      return;
    }

    const firstOutput = possibleOutputs[0];
    if (!firstOutput) return;

    append({
      productId: firstOutput._id,
      quantityProduced: 0,
      lotNumber: `${selectedRun?.inputLotNumber ?? "LOTE"}_SP_${(fields.length + 1).toString().padStart(2, "0")}`,
      warehouseId: warehouses?.[0]?._id ?? "",
      qualityFactors: [],
    });
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      await addOutputsToProductionRun({
        productionRunId: data.productionRunId as Id<"productionRuns">,
        outputs: data.outputs.map((o) => ({
          productId: o.productId as Id<"products">,
          quantityProduced: convertToCanonical(o.quantityProduced, "kg"),
          lotNumber: o.lotNumber,
          warehouseId: o.warehouseId as Id<"warehouse">,
          qualityFactors: o.qualityFactors.map((qf) => ({
            factorId: qf.factorId as Id<"qualityFactors">,
            value: qf.value,
          })),
        })),
      });
      toast.success("Salida de producción registrada.");
      form.reset({ productionRunId: "", outputs: [] });
    } catch (error) {
      console.error(error);
      toast.error("Error al registrar la salida de producción.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!productionRuns || !warehouses) {
    return (
      <div className="p-7 mt-3 flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="w-full border border-primary rounded-lg p-7 mt-3">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            name="productionRunId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Entrada de Producción <span className="text-destructive">*</span>
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione una entrada..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(productionRuns ?? []).map((run) => (
                      <SelectItem key={run._id} value={run._id}>
                        {`${run.inputProductName} - ${run.inputLotNumber} (${new Date(run.runDate).toLocaleDateString()})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          {selectedRun && (
            <fieldset className="space-y-4 pt-4 border-t">
              <legend className="text-lg font-semibold">Salidas de Producción</legend>

              {fields.map((field, index) => (
                <OutputCard
                  key={field.id}
                  form={form}
                  index={index}
                  warehouses={warehouses}
                  possibleOutputs={possibleOutputs ?? []}
                  onRemove={() => remove(index)}
                />
              ))}

              <Button type="button" variant="outline" onClick={handleAddOutput}>
                <PlusIcon className="size-4 mr-2" />
                Añadir Salida
              </Button>

              <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
                {isSubmitting ? <LoadingSpinner /> : "Registrar Salida"}
              </Button>
            </fieldset>
          )}
        </form>
      </Form>
    </div>
  );
}

function OutputCard({
  form,
  index,
  warehouses,
  possibleOutputs,
  onRemove,
}: any) {
  const outputProductId = useWatch({
    control: form.control,
    name: `outputs.${index}.productId`,
  });

  const qualityFactors = useQuery(
    api.products.getQualityFactorsForProduct,
    outputProductId ? { productId: outputProductId } : "skip",
  );

  return (
    <div className="p-4 border rounded-md grid grid-cols-1 md:grid-cols-3 gap-4 relative">
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={onRemove}
        className="absolute top-2 right-2"
      >
        X
      </Button>

      <div className="md:col-span-3">
        <FormField
          control={form.control}
          name={`outputs.${index}.productId`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Producto</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un producto de salida..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {possibleOutputs.map((p: any) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name={`outputs.${index}.quantityProduced`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Cant. Producida (kg)</FormLabel>
            <FormControl>
              <Input
                type="number"
                value={field.value ?? ""}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`outputs.${index}.lotNumber`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>No. Tiquete</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`outputs.${index}.warehouseId`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Bodega</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Bodega..." />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {warehouses.map((w: any) => (
                  <SelectItem key={w._id} value={w._id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />

      {qualityFactors && qualityFactors.length > 0 && (
        <div className="md:col-span-3 grid grid-cols-2 gap-4 pt-2 border-t mt-2">
          {qualityFactors.map((qf: any, factorIndex: number) => (
            <div key={qf._id}>
              <p className="text-sm mb-1">{qf.name}</p>
              <Input
                placeholder={qf.unit}
                value={form.watch(`outputs.${index}.qualityFactors.${factorIndex}.value`) || ""}
                onChange={(e) => {
                  form.setValue(
                    `outputs.${index}.qualityFactors.${factorIndex}.factorId`,
                    qf._id,
                  );
                  form.setValue(
                    `outputs.${index}.qualityFactors.${factorIndex}.value`,
                    e.target.value,
                  );
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
