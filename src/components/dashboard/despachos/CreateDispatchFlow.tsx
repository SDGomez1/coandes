"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusIcon, RotateCcwIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { cn, formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
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
import { toLocalCalendarDate, toLocalDayTimestamp } from "@/lib/date";
import { convertFromCanonical, convertToCanonical } from "@/lib/units";

type ProductionCharacteristic = {
  name: string;
  value: string;
};

type InventoryLotOption = {
  _id: Id<"inventoryLots">;
  lotNumber: string;
  quantity: number;
  creationDate: number;
  productionCharacteristics?: ProductionCharacteristic[];
};

const QUANTITY_TOLERANCE = 0.001;

const dispatchItemSchema = z.object({
  inventoryLotId: z.string().min(1, "Debe seleccionar un tiquete."),
  quantityDispatched: z.number().positive("La cantidad debe ser mayor que cero."),
});

const formSchema = z.object({
  productId: z.string().min(1, "Debe seleccionar un producto."),
  dispatchDate: z.date({ error: "Debe seleccionar una fecha." }),
  requestedQuantity: z
    .number()
    .positive("La cantidad solicitada debe ser mayor que cero."),
  customerId: z.string().min(1, "Debe seleccionar un cliente."),
  ticketNumber: z
    .string()
    .trim()
    .min(1, "Debe ingresar el No. tiquete despacho."),
  items: z.array(dispatchItemSchema).min(1, "Debe asignar al menos un tiquete."),
});

type DispatchFormValues = z.infer<typeof formSchema>;

function areQuantitiesEqual(leftValue: number, rightValue: number) {
  return Math.abs(leftValue - rightValue) <= QUANTITY_TOLERANCE;
}

function sortLotsForDispatch(lots: InventoryLotOption[]) {
  return [...lots].sort((leftLot, rightLot) => {
    if (leftLot.creationDate !== rightLot.creationDate) {
      return leftLot.creationDate - rightLot.creationDate;
    }
    return leftLot.lotNumber.localeCompare(rightLot.lotNumber);
  });
}

function buildSuggestedItems(
  lots: InventoryLotOption[],
  requestedQuantity: number,
): DispatchFormValues["items"] {
  if (requestedQuantity <= 0) {
    return [];
  }

  const items: DispatchFormValues["items"] = [];
  let remainingQuantity = requestedQuantity;

  for (const lot of lots) {
    if (remainingQuantity <= QUANTITY_TOLERANCE) {
      break;
    }

    const quantityDispatched = Math.min(lot.quantity, remainingQuantity);
    if (quantityDispatched <= QUANTITY_TOLERANCE) {
      continue;
    }

    items.push({
      inventoryLotId: lot._id,
      quantityDispatched,
    });
    remainingQuantity -= quantityDispatched;
  }

  return items;
}

function getProductionCharacteristicLabel(
  characteristics: ProductionCharacteristic[] | undefined,
) {
  if (!characteristics || characteristics.length === 0) {
    return [];
  }

  return characteristics.map(
    (characteristic) => `${characteristic.name}: ${characteristic.value}`,
  );
}

function formatWeight(value: number) {
  return `${formatNumber(convertFromCanonical(value, "kg"))} kg`;
}

export default function CreateDispatchFlow() {
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div>
      <button
        className={cn(
          "flex gap-2 text-xs justify-center items-center border-[#EBE9E9] shadow p-2 rounded border hover:shadow-lg transition-all cursor-pointer w-48",
          isCreating && "border-primary",
        )}
        onClick={() => setIsCreating((currentValue) => !currentValue)}
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
        Crear Despacho
      </button>

      {isCreating && <DispatchForm />}
    </div>
  );
}

function DispatchForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const organization = useQuery(api.organizations.getOrg);
  const orgId = organization?._id;

  const finishedGoods = useQuery(
    api.products.getProductsByType,
    orgId ? { organizationId: orgId, type: "Finished Good" } : "skip",
  );
  const customers = useQuery(
    api.customers.getCustomers,
    orgId ? { organizationId: orgId } : "skip",
  );

  const createDispatch = useMutation(api.dispatches.createDispatch);

  const form = useForm<DispatchFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productId: "",
      dispatchDate: new Date(),
      requestedQuantity: 0,
      customerId: "",
      ticketNumber: "",
      items: [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const selectedProductId = useWatch({
    control: form.control,
    name: "productId",
  });
  const requestedQuantity = useWatch({
    control: form.control,
    name: "requestedQuantity",
  });
  const dispatchItems = useWatch({
    control: form.control,
    name: "items",
  }) ?? [];

  const availableLots = useQuery(
    api.inventory.getLotsForProduct,
    selectedProductId && orgId
      ? {
          productId: selectedProductId as Id<"products">,
          organizationId: orgId,
        }
      : "skip",
  );

  const sortedAvailableLots = sortLotsForDispatch(
    (availableLots ?? []) as InventoryLotOption[],
  );
  const requestedQuantitySafe = requestedQuantity ?? 0;
  const assignedQuantity = dispatchItems.reduce(
    (total, item) => total + (item?.quantityDispatched ?? 0),
    0,
  );
  const totalAvailableQuantity = sortedAvailableLots.reduce(
    (total, lot) => total + lot.quantity,
    0,
  );
  const remainingToAssignRaw = requestedQuantitySafe - assignedQuantity;
  const remainingToAssign = areQuantitiesEqual(remainingToAssignRaw, 0)
    ? 0
    : remainingToAssignRaw;
  const isShortOnStock =
    requestedQuantitySafe - totalAvailableQuantity > QUANTITY_TOLERANCE;
  const isOverAssigned = remainingToAssign < 0;
  const today = toLocalCalendarDate(new Date());

  useEffect(() => {
    if (!selectedProductId || requestedQuantitySafe <= 0 || !availableLots) {
      replace([]);
      return;
    }

    replace(
      buildSuggestedItems(
        sortLotsForDispatch(availableLots as InventoryLotOption[]),
        requestedQuantitySafe,
      ),
    );
  }, [availableLots, replace, requestedQuantitySafe, selectedProductId]);

  function getLotById(lotId: string) {
    return sortedAvailableLots.find((lot) => lot._id === lotId);
  }

  function getAvailableOptionsForRow(index: number) {
    const selectedIds = new Set(
      dispatchItems
        .map((item, itemIndex) =>
          itemIndex === index ? null : item?.inventoryLotId,
        )
        .filter((value): value is string => Boolean(value)),
    );

    return sortedAvailableLots.filter((lot) => !selectedIds.has(lot._id));
  }

  function applySuggestedItems() {
    replace(buildSuggestedItems(sortedAvailableLots, requestedQuantitySafe));
  }

  function handleAddItem() {
    const selectedIds = new Set(
      dispatchItems
        .map((item) => item?.inventoryLotId)
        .filter((value): value is string => Boolean(value)),
    );

    const firstUnusedLot = sortedAvailableLots.find(
      (lot) => !selectedIds.has(lot._id),
    );

    if (!firstUnusedLot) {
      toast.error("No hay más tiquetes disponibles para agregar.");
      return;
    }

    const quantityToPrefill =
      remainingToAssign > 0
        ? Math.min(firstUnusedLot.quantity, remainingToAssign)
        : 0;

    append({
      inventoryLotId: firstUnusedLot._id,
      quantityDispatched: quantityToPrefill,
    });
  }

  function validateItems(data: DispatchFormValues) {
    form.clearErrors("items");

    if (data.items.length === 0) {
      toast.error("Debe asignar al menos un tiquete.");
      return false;
    }

    const usedLots = new Set<string>();
    const assignedFromData = data.items.reduce(
      (total, item) => total + item.quantityDispatched,
      0,
    );

    for (let index = 0; index < data.items.length; index += 1) {
      const item = data.items[index];
      if (!item) {
        continue;
      }

      if (usedLots.has(item.inventoryLotId)) {
        form.setError(`items.${index}.inventoryLotId`, {
          type: "manual",
          message: "No puede repetir el mismo tiquete.",
        });
        toast.error("No puede repetir el mismo tiquete en el despacho.");
        return false;
      }
      usedLots.add(item.inventoryLotId);

      const selectedLot = getLotById(item.inventoryLotId);
      if (!selectedLot) {
        form.setError(`items.${index}.inventoryLotId`, {
          type: "manual",
          message: "El tiquete seleccionado ya no está disponible.",
        });
        toast.error("Uno de los tiquetes seleccionados ya no está disponible.");
        return false;
      }

      if (item.quantityDispatched <= QUANTITY_TOLERANCE) {
        form.setError(`items.${index}.quantityDispatched`, {
          type: "manual",
          message: "La cantidad debe ser mayor que cero.",
        });
        toast.error("Cada tiquete debe tener una cantidad mayor que cero.");
        return false;
      }

      if (item.quantityDispatched - selectedLot.quantity > QUANTITY_TOLERANCE) {
        form.setError(`items.${index}.quantityDispatched`, {
          type: "manual",
          message: `La cantidad no puede superar ${formatWeight(selectedLot.quantity)}.`,
        });
        toast.error("Una de las cantidades supera el disponible del tiquete.");
        return false;
      }
    }

    if (!areQuantitiesEqual(assignedFromData, data.requestedQuantity)) {
      toast.error("La cantidad asignada debe coincidir con la cantidad solicitada.");
      return false;
    }

    if (data.requestedQuantity - totalAvailableQuantity > QUANTITY_TOLERANCE) {
      toast.error("No hay stock suficiente para cubrir el despacho.");
      return false;
    }

    return true;
  }

  const onSubmit = async (data: DispatchFormValues) => {
    if (!orgId) {
      toast.error("No se pudo identificar la organización actual.");
      return;
    }

    if (!validateItems(data)) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createDispatch({
        organizationId: orgId,
        customerId: data.customerId as Id<"customers">,
        dispatchDate: toLocalDayTimestamp(data.dispatchDate),
        items: data.items.map((item) => ({
          inventoryLotId: item.inventoryLotId as Id<"inventoryLots">,
          quantityDispatched: item.quantityDispatched,
          ticketNumber: data.ticketNumber.trim(),
        })),
      });

      toast.success("Despacho creado.");
      form.reset({
        productId: "",
        dispatchDate: new Date(),
        requestedQuantity: 0,
        customerId: "",
        ticketNumber: "",
        items: [],
      });
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Error al crear el despacho.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!finishedGoods || !customers) {
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Producto <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.clearErrors("items");
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un producto..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {finishedGoods.map((product) => (
                        <SelectItem key={product._id} value={product._id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dispatchDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Fecha de despacho <span className="text-destructive">*</span>
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
              control={form.control}
              name="requestedQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Cantidad solicitada <span className="text-destructive">*</span>
                  </FormLabel>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        step="any"
                        onChange={(event) =>
                          field.onChange(
                            convertToCanonical(Number(event.target.value), "kg"),
                          )
                        }
                        value={
                          field.value
                            ? parseFloat(
                                convertFromCanonical(
                                  field.value,
                                  "kg",
                                ).toPrecision(10),
                              )
                            : ""
                        }
                      />
                    </FormControl>
                    <span className="text-sm font-medium">kg</span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="rounded-lg border border-dashed p-4 space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium">Propuesta de tiquetes</p>
                <p className="text-sm text-muted-foreground">
                  Se sugieren tiquetes por FIFO y puede ajustar la mezcla antes de guardar.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={applySuggestedItems}
                  disabled={
                    !selectedProductId ||
                    requestedQuantitySafe <= 0 ||
                    sortedAvailableLots.length === 0
                  }
                >
                  <RotateCcwIcon className="size-4 mr-2" />
                  Recalcular propuesta
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddItem}
                  disabled={!selectedProductId || sortedAvailableLots.length === 0}
                >
                  <PlusIcon className="size-4 mr-2" />
                  Agregar tiquete
                </Button>
              </div>
            </div>

            {selectedProductId && availableLots && sortedAvailableLots.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No hay tiquetes activos disponibles para este producto.
              </p>
            )}

            {fields.length === 0 && sortedAvailableLots.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Ingrese una cantidad para generar la propuesta automática.
              </p>
            )}

            {fields.map((itemField, index) => {
              const selectedLotId = dispatchItems[index]?.inventoryLotId ?? "";
              const selectedLot = getLotById(selectedLotId);
              const availableOptions = getAvailableOptionsForRow(index);
              const productionCharacteristics = getProductionCharacteristicLabel(
                selectedLot?.productionCharacteristics,
              );

              return (
                <div
                  key={itemField.id}
                  className="rounded-lg border p-4 space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr_auto] gap-4">
                    <FormField
                      control={form.control}
                      name={`items.${index}.inventoryLotId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Tiquete origen <span className="text-destructive">*</span>
                          </FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              const nextLot = getLotById(value);
                              if (!nextLot) {
                                return;
                              }

                              const currentQuantity =
                                dispatchItems[index]?.quantityDispatched ?? 0;
                              const nextQuantity =
                                currentQuantity > 0
                                  ? Math.min(currentQuantity, nextLot.quantity)
                                  : 0;

                              form.setValue(
                                `items.${index}.quantityDispatched`,
                                nextQuantity,
                                { shouldValidate: true, shouldDirty: true },
                              );
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione un tiquete..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableOptions.map((lot) => (
                                <SelectItem key={lot._id} value={lot._id}>
                                  {lot.lotNumber} ({formatWeight(lot.quantity)})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.quantityDispatched`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Cantidad a despachar <span className="text-destructive">*</span>
                          </FormLabel>
                          <div className="flex items-center gap-2">
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                step="any"
                                onChange={(event) =>
                                  field.onChange(
                                    convertToCanonical(
                                      Number(event.target.value),
                                      "kg",
                                    ),
                                  )
                                }
                                value={
                                  field.value
                                    ? parseFloat(
                                        convertFromCanonical(
                                          field.value,
                                          "kg",
                                        ).toPrecision(10),
                                      )
                                    : ""
                                }
                              />
                            </FormControl>
                            <span className="text-sm font-medium">kg</span>
                          </div>
                          <FormMessage />
                          <p className="text-xs text-muted-foreground">
                            Disponible:{" "}
                            {selectedLot
                              ? formatWeight(selectedLot.quantity)
                              : "Seleccione un tiquete"}
                          </p>
                        </FormItem>
                      )}
                    />

                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        <Trash2Icon className="size-4 mr-2" />
                        Quitar
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-muted/30 p-4">
                    <p className="text-sm font-medium">Características de producción</p>
                    {productionCharacteristics.length > 0 ? (
                      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                        {productionCharacteristics.map((characteristic) => (
                          <li key={characteristic}>{characteristic}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Sin características de producción.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            <div className="rounded-lg bg-muted/40 p-4 space-y-2">
              <div className="flex flex-col gap-1 text-sm md:flex-row md:items-center md:justify-between">
                <span>Cantidad solicitada</span>
                <span className="font-medium">{formatWeight(requestedQuantitySafe)}</span>
              </div>
              <div className="flex flex-col gap-1 text-sm md:flex-row md:items-center md:justify-between">
                <span>Cantidad asignada</span>
                <span className="font-medium">{formatWeight(assignedQuantity)}</span>
              </div>
              <div className="flex flex-col gap-1 text-sm md:flex-row md:items-center md:justify-between">
                <span>Stock disponible</span>
                <span className="font-medium">{formatWeight(totalAvailableQuantity)}</span>
              </div>
              <p
                className={cn(
                  "text-sm",
                  isShortOnStock || isOverAssigned || remainingToAssign > 0
                    ? "text-destructive"
                    : "text-emerald-700",
                )}
              >
                {isShortOnStock
                  ? `Faltan ${formatWeight(requestedQuantitySafe - totalAvailableQuantity)} para cubrir el despacho con el stock actual.`
                  : isOverAssigned
                    ? `La propuesta supera lo solicitado por ${formatWeight(Math.abs(remainingToAssign))}.`
                    : remainingToAssign > 0
                      ? `Faltan ${formatWeight(remainingToAssign)} por asignar.`
                      : requestedQuantitySafe > 0
                        ? "La propuesta cubre exactamente la cantidad solicitada."
                        : "Ingrese una cantidad para generar la propuesta."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="ticketNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    No. tiquete despacho <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="No. Tiquete" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Cliente <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={customers.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer._id} value={customer._id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {customers.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No hay clientes creados. Cree uno desde Gestión de Clientes.
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button
            type="submit"
            disabled={
              isSubmitting ||
              customers.length === 0 ||
              requestedQuantitySafe <= 0 ||
              dispatchItems.length === 0 ||
              !areQuantitiesEqual(assignedQuantity, requestedQuantitySafe) ||
              isShortOnStock
            }
            className="w-full md:w-auto"
          >
            {isSubmitting ? <LoadingSpinner /> : "Crear Despacho"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
