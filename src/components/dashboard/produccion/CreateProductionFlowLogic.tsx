"use client";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useForm, useWatch, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { PlusIcon, AlertTriangle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import {
  WeightUnit,
  convertFromCanonical,
  convertToCanonical,
  WEIGHT_UNIT_OPTIONS,
} from "@/lib/units";
import Link from "next/link";
const outputSchema = z.object({
  productId: z.string().min(1),
  quantityProduced: z.number().nonnegative(),
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
  inputProductId: z.string().min(1, "Debe seleccionar un producto de entrada."),
  inputLotId: z.string().min(1, "Debe seleccionar un lote de entrada."),
  quantityConsumed: z.number().positive("La cantidad debe ser mayor que cero."),
  notes: z.string().optional(),
  outputs: z.array(outputSchema),
});
type ProductionFormValues = z.infer<typeof formSchema>;

export default function ProductionForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const organization = useQuery(api.organizations.getOrg);
  const orgId = organization?._id;

  const producibleStock = useQuery(
    api.inventory.getProducibleStock,
    orgId ? { organizationId: orgId } : "skip",
  );
  const warehouses = useQuery(api.warehouse.getAvailableWarehouse);
  const createProductionRun = useMutation(api.production.createProductionRun);

  const form = useForm<ProductionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      inputProductId: "",
      inputLotId: "",
      outputs: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "outputs",
  });

  const inputProductId = useWatch({
    control: form.control,
    name: "inputProductId",
  });
  const availableLots = useQuery(
    api.inventory.getLotsForProduct,
    inputProductId && orgId
      ? { productId: inputProductId as Id<"products">, organizationId: orgId }
      : "skip",
  );

  const inputLotId = useWatch({ control: form.control, name: "inputLotId" });
  const selectedInputLot = availableLots?.find((lot) => lot._id === inputLotId);

  const possibleOutputs = useQuery(
    api.products.getPossibleOutputs,
    inputProductId
      ? { inputProductId: inputProductId as Id<"products"> }
      : "skip",
  );

  const handleAddOutput = () => {
    if (!selectedInputLot) {
      toast.error("Debe seleccionar un lote de entrada primero.");
      return;
    }

    if (possibleOutputs && possibleOutputs.length > 0) {
      const firstOutput = possibleOutputs[0];
      if (firstOutput) {
        append({
          productId: firstOutput._id,
          quantityProduced: 0,
          lotNumber: `${selectedInputLot.lotNumber}_SP_${(fields.length + 1).toString().padStart(2, "0")}`,
          warehouseId: warehouses ? warehouses[0]._id : "",
          qualityFactors: [],
        });
      }
    }
  };

  const onSubmit = async (data: ProductionFormValues) => {
    if (
      !selectedInputLot ||
      data.quantityConsumed > selectedInputLot.quantity
    ) {
      form.setError("quantityConsumed", {
        type: "manual",
        message: `La cantidad no puede ser mayor que la disponible (${selectedInputLot?.quantity}).`,
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await createProductionRun({
        organizationId: orgId!,
        inputLotId: data.inputLotId as Id<"inventoryLots">,
        quantityConsumed: data.quantityConsumed,

        notes: data.notes,
        outputs: data.outputs
          .filter((o) => o.quantityProduced > 0)
          .map((o) => ({
            ...o,
            productId: o.productId as Id<"products">,
            warehouseId: o.warehouseId as Id<"warehouse">,
            quantityProduced: convertToCanonical(o.quantityProduced, "kg"),
            qualityFactors: o.qualityFactors.map((qf) => ({
              ...qf,
              factorId: qf.factorId as Id<"qualityFactors">,
            })),
          })),
      });
      toast.success("Producción registrada correctamente.");
      form.reset();
    } catch (error) {
      console.error("Production creation failed:", error);
      toast.error("Error al registrar la producción.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!producibleStock || !warehouses)
    return (
      <div className="p-7 mt-3 flex justify-center">
        <LoadingSpinner />
      </div>
    );

  return (
    <div className="w-full border border-primary rounded-lg p-7 mt-3">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, (e) => console.log(e))}
          className="space-y-6"
        >
          {/* --- Input Selection --- */}
          <fieldset className="space-y-4">
            <legend className="text-lg font-semibold">
              Entrada de Producción
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                name="inputProductId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Producto de Entrada{" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un producto..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {producibleStock.map((p) => (
                          <SelectItem key={p._id} value={p._id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              {inputProductId && (
                <FormField
                  name="inputLotId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        No Tiquete <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                !availableLots
                                  ? "Cargando..."
                                  : "Seleccione un lote..."
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableLots?.map((lot) => (
                            <SelectItem key={lot._id} value={lot._id}>
                              {`${lot.lotNumber} (Disp: ${parseFloat(
                                convertFromCanonical(
                                  lot.quantity,
                                  "kg",
                                ).toPrecision(10),
                              )} kg)`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              )}
            </div>
          </fieldset>

          {/* --- Input & Output Details --- */}
          {selectedInputLot && (
            <div className="space-y-6 pt-4 border-t">
              <FormField
                control={form.control}
                name="quantityConsumed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Cantidad a Consumir{" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="flex items-center max-w-xs gap-2">
                        <Input
                          placeholder="0"
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                        <span className="font-medium">kg</span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <fieldset className="space-y-4 pt-4 border-t">
                <legend className="text-lg font-semibold">
                  Salidas de Producción
                </legend>
                {possibleOutputs && possibleOutputs.length === 0 && (
                  <div className="flex items-center gap-3 text-yellow-600 bg-yellow-50 border border-yellow-200 p-4 rounded-md">
                    <AlertTriangle className="size-5" />
                    <p className="font-medium text-sm">
                      Este producto no tiene configurados productos resultantes.
                      <Link
                        href={"/dashboard/creacion-productos"}
                        className="ml-1 text-primary hover:underline flex items-center gap-1"
                      >
                        Configurar ahora <ArrowRight className="size-4" />
                      </Link>
                    </p>
                  </div>
                )}
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
                {possibleOutputs && possibleOutputs.length > 0 && (
                  <Button
                    type="button"
                    variant={"outline"}
                    onClick={handleAddOutput}
                    className="text-xs"
                  >
                    <PlusIcon className="size-4 mr-2" />
                    Añadir Salida
                  </Button>
                )}
              </fieldset>

              <FormField
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Notas de producción..." {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full md:w-auto"
              >
                {isSubmitting ? <LoadingSpinner /> : "Registrar Producción"}
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}

// This should be a separate component file, but for simplicity...
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

  const outputProduct = possibleOutputs.find(
    (p: any) => p?._id === outputProductId,
  );

  return (
    <div className="p-4 border rounded-md grid grid-cols-1 md:grid-cols-3 gap-4 relative">
      <Button
        type="button"
        variant={"destructive"}
        size={"sm"}
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
                      {p.name} (
                      {p.type == "Finished Good"
                        ? "Producto final"
                        : "Sub-producto"}
                      )
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      </div>

      {outputProduct && (
        <>
          <div className="flex items-end gap-2">
            <FormField
              control={form.control}
              name={`outputs.${index}.quantityProduced`}
              render={({ field }) => (
                <FormItem className="flex-grow">
                  <FormLabel>Cant. Producida (kg)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

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
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
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
            <div className="md:col-span-3 space-y-2 pt-2 border-t mt-2">
              <h5 className="font-semibold">Factores de Calidad</h5>
              <QualityFactorInputs
                form={form}
                outputIndex={index}
                qualityFactors={qualityFactors}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function QualityFactorInputs({ form, outputIndex, qualityFactors }: any) {
  const { fields, append } = useFieldArray({
    control: form.control,
    name: `outputs.${outputIndex}.qualityFactors`,
  });

  // Effect to set initial quality factors
  useState(() => {
    if (qualityFactors && fields.length === 0) {
      const initialFactors = qualityFactors.map((qf: any) => ({
        factorId: qf._id,
        value: "",
      }));
      form.setValue(`outputs.${outputIndex}.qualityFactors`, initialFactors);
    }
  });

  return (
    <div className="grid grid-cols-2 gap-4">
      {qualityFactors.map((qf: any, factorIndex: number) => (
        <FormField
          key={qf._id}
          control={form.control}
          name={`outputs.${outputIndex}.qualityFactors.${factorIndex}.value`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{qf.name}</FormLabel>
              <FormControl>
                <Input {...field} placeholder={qf.unit} />
              </FormControl>
            </FormItem>
          )}
        />
      ))}
    </div>
  );
}
