"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/assets/icons/LoadingSpinner";
import { toLocalCalendarDate, toLocalDayTimestamp } from "@/lib/date";
import { convertFromCanonical, convertToCanonical } from "@/lib/units";

const formSchema = z.object({
  inputProductId: z.string().min(1, "Debe seleccionar un producto de entrada."),
  inputLotId: z.string().min(1, "Debe seleccionar un lote de entrada."),
  productionDate: z.date({ error: "Debe seleccionar una fecha." }),
  quantityConsumed: z.preprocess(
    (value) =>
      value === "" || value === undefined || value === null
        ? undefined
        : Number(value),
    z.number().positive("La cantidad debe ser mayor que cero."),
  ),
  notes: z.string().optional(),
});

type ProductionEntryFormValues = z.input<typeof formSchema>;
type ProductionEntrySubmitValues = z.output<typeof formSchema>;

export default function ProductionEntryForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const organization = useQuery(api.organizations.getOrg);
  const orgId = organization?._id;
  const today = toLocalCalendarDate(new Date());

  const producibleStock = useQuery(
    api.inventory.getProducibleStock,
    orgId ? { organizationId: orgId } : "skip",
  );
  const createProductionRun = useMutation(api.production.createProductionRun);

  const form = useForm<ProductionEntryFormValues, unknown, ProductionEntrySubmitValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      inputProductId: "",
      inputLotId: "",
      productionDate: today,
      notes: "",
    },
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

  useEffect(() => {
    if (availableLots && inputLotId && !selectedInputLot) {
      form.setValue("inputLotId", "");
      form.setValue("quantityConsumed", undefined);
    }
  }, [availableLots, form, inputLotId, selectedInputLot]);

  const onSubmit = async (data: ProductionEntrySubmitValues) => {
    if (!selectedInputLot || data.quantityConsumed > selectedInputLot.quantity) {
      form.setError("quantityConsumed", {
        type: "manual",
        message: `La cantidad no puede ser mayor que la disponible (${convertFromCanonical(
          selectedInputLot?.quantity ?? 0,
          "kg",
        ).toFixed(2)} kg).`,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createProductionRun({
        organizationId: orgId!,
        inputLotId: data.inputLotId as Id<"inventoryLots">,
        productionDate: toLocalDayTimestamp(data.productionDate),
        quantityConsumed: convertToCanonical(data.quantityConsumed, "kg"),
        notes: data.notes,
        outputs: [],
      });
      toast.success("Entrada de producción registrada.");
      form.reset({
        inputProductId: "",
        inputLotId: "",
        productionDate: toLocalCalendarDate(new Date()),
        notes: "",
      });
    } catch (error) {
      console.error("Production entry creation failed:", error);
      toast.error("Error al registrar la entrada de producción.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!producibleStock)
    return (
      <div className="p-7 mt-3 flex justify-center">
        <LoadingSpinner />
      </div>
    );

  return (
    <div className="w-full border border-primary rounded-lg p-7 mt-3">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <fieldset className="space-y-4">
            <legend className="text-lg font-semibold">Entrada de Producción</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                name="inputProductId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Producto de Entrada <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue("inputLotId", "");
                        form.setValue("quantityConsumed", undefined);
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un producto..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(producibleStock ?? []).map((p) => (
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={!availableLots ? "Cargando..." : "Seleccione un lote..."}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(availableLots ?? []).map((lot) => (
                            <SelectItem key={lot._id} value={lot._id}>
                              {`${lot.lotNumber} (Disp: ${parseFloat(
                                convertFromCanonical(lot.quantity, "kg").toPrecision(10),
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

          {selectedInputLot && (
            <div className="space-y-6 pt-4 border-t">
              <FormField
                name="quantityConsumed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Cantidad a Consumir <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="flex items-center max-w-xs gap-2">
                        <Input
                          placeholder="Cantidad en kg"
                          type="number"
                          min="0"
                          max={convertFromCanonical(selectedInputLot.quantity, "kg")}
                          step="any"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === "" ? undefined : Number(e.target.value),
                            )
                          }
                        />
                        <span className="font-medium">kg</span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="productionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Fecha de entrada <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={(date) =>
                          field.onChange(date ?? toLocalCalendarDate(new Date()))
                        }
                        placeholder="Seleccione una fecha"
                        disabled={(date) => toLocalCalendarDate(date) > today}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

              <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
                {isSubmitting ? <LoadingSpinner /> : "Registrar Entrada"}
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}
