"use client";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useForm, useWatch, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { PlusIcon } from "lucide-react";
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

// ------------------- Main Component -------------------
export default function CreateProductionFlow() {
  const [isCreating, setIsCreating] = useState(false);
  return (
    <div>
      <button
        className={cn(
          "flex gap-2 text-xs justify-center items-center border-[#EBE9E9] shadow p-2 rounded border hover:shadow-lg transition-all cursor-pointer w-56",
          isCreating && "border-primary",
        )}
        onClick={() => setIsCreating(!isCreating)}
      >
        <span
          className={cn(
            "flex size-5 text-black border border-black rounded-full justify-center items-center transition-all",
            isCreating && "border-primary",
          )}
        >
          <PlusIcon
            className={cn(
              "size-3 transition-all",
              isCreating && "text-primary",
            )}
          />
        </span>
        Registrar Nueva Producción
      </button>
      {isCreating && <ProductionForm />}
    </div>
  );
}

// ------------------- Form Component -------------------
const outputSchema = z.object({
  productId: z.string().min(1),
  quantityProduced: z.number().nonnegative(),
  lotNumber: z.string(),
  warehouseId: z.string().min(1),
});

const formSchema = z.object({
  inputProductId: z.string().min(1, "Debe seleccionar un producto de entrada."),
  inputLotId: z.string().min(1, "Debe seleccionar un lote de entrada."),
  quantityConsumed: z.number().positive("La cantidad debe ser mayor que cero."),
  notes: z.string().optional(),
  outputs: z.array(outputSchema),
});
type ProductionFormValues = z.infer<typeof formSchema>;

function ProductionForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const organization = useQuery(api.organizations.getOrg);
  const orgId = organization?._id;

  const producibleStock = useQuery(
    api.inventory.getProducibleStock,
    orgId ? { organizationId: orgId } : "skip",
  );
  const warehouses = useQuery(api.warehouse.getAvailableWarehose);
  const createProductionRun = useMutation(api.production.createProductionRun);

  const form = useForm<ProductionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      inputProductId: "",
      inputLotId: "",
      quantityConsumed: 0,
      outputs: [],
    },
  });

  const { fields, append } = useFieldArray({
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

  // Effect to populate outputs when possibleOutputs are loaded
  useState(() => {
    if (possibleOutputs && possibleOutputs.length > 0 && fields.length === 0) {
      form.setValue(
        "outputs",
        possibleOutputs.map((p) => ({
          productId: p!._id,
          quantityProduced: 0,
          lotNumber:
            p!.type !== "By-product" ? `LOTE-${p!.sku}-${Date.now()}` : "",
          warehouseId: "",
        })),
      );
    }
  });

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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        No Tiquete{" "}
                        <span className="text-destructive">*</span>
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
                            <SelectItem
                              key={lot._id}
                              value={lot._id}
                            >{`${lot.lotNumber} (Disp: ${lot.quantity} ${lot.unit})`}</SelectItem>
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
                name="quantityConsumed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Cantidad a Consumir ({selectedInputLot.unit}){" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...form.register("quantityConsumed", {
                          valueAsNumber: true,
                          max: selectedInputLot.quantity,
                        })}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <fieldset className="space-y-4 pt-4 border-t">
                <legend className="text-lg font-semibold">
                  Salidas de Producción
                </legend>
                {fields.map((field, index) => {
                  const outputProduct = possibleOutputs?.find(
                    (p) => p?._id === field.productId,
                  );
                  if (!outputProduct) return null;
                  return (
                    <div
                      key={field.id}
                      className="p-4 border rounded-md grid grid-cols-1 md:grid-cols-3 gap-4 relative"
                    >
                      <h4 className="md:col-span-3 font-medium">
                        {outputProduct.name}{" "}
                        <span className="text-xs text-gray-500">
                          ({outputProduct.type})
                        </span>
                      </h4>
                      <FormField
                        control={form.control}
                        name={`outputs.${index}.quantityProduced`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cant. Producida</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...form.register(
                                  `outputs.${index}.quantityProduced`,
                                  { valueAsNumber: true },
                                )}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      {outputProduct.type !== "By-product" && (
                        <>
                          <FormField
                            control={form.control}
                            name={`outputs.${index}.lotNumber`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nuevo Lote</FormLabel>
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
                                    {warehouses.map((w) => (
                                      <SelectItem key={w._id} value={w._id}>
                                        {w.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                        </>
                      )}
                    </div>
                  );
                })}
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
