"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  useFieldArray,
  useForm,
  useWatch,
  type FieldArrayWithId,
  type UseFormReturn,
} from "react-hook-form";
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

type DispatchMode = "finishedGoods" | "byProducts";

type ProductionCharacteristic = {
  name: string;
  value: string;
};

type CustomerOption = {
  _id: Id<"customers">;
  name: string;
  details?: string;
};

type InventoryLotOption = {
  _id: Id<"inventoryLots">;
  productId: Id<"products">;
  productName: string;
  productType: "Finished Good" | "By-product";
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

const baseDispatchSchema = z.object({
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

const finishedGoodsFormSchema = baseDispatchSchema;

const byProductFormSchema = baseDispatchSchema.extend({
  productId: z.string().min(1, "Debe seleccionar un subproducto."),
});

type DispatchItem = z.infer<typeof dispatchItemSchema>;
type BaseDispatchFormValues = z.infer<typeof baseDispatchSchema>;
type FinishedGoodsFormValues = z.infer<typeof finishedGoodsFormSchema>;
type ByProductFormValues = z.infer<typeof byProductFormSchema>;

type SharedDispatchFormValues = FinishedGoodsFormValues | ByProductFormValues;

type DispatchMetrics = {
  assignedQuantity: number;
  totalAvailableQuantity: number;
  remainingToAssign: number;
  isShortOnStock: boolean;
  isOverAssigned: boolean;
};

type DispatchFormBodyProps = {
  form: UseFormReturn<any>;
  contextField: ReactNode;
  customers: CustomerOption[];
  fields: FieldArrayWithId<any, "items", "id">[];
  dispatchItems: DispatchItem[];
  sortedAvailableLots: InventoryLotOption[];
  requestedQuantitySafe: number;
  metrics: DispatchMetrics;
  canSelectLots: boolean;
  statusMessage: string | null;
  isSubmitting: boolean;
  onSubmit: (data: any) => Promise<void>;
  applySuggestedItems: () => void;
  handleAddItem: () => void;
  getLotById: (lotId: string) => InventoryLotOption | undefined;
  getAvailableOptionsForRow: (index: number) => InventoryLotOption[];
  removeItem: (index: number) => void;
};

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
): DispatchItem[] {
  if (requestedQuantity <= 0) {
    return [];
  }

  const items: DispatchItem[] = [];
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

function areDispatchItemsEqual(
  leftItems: DispatchItem[],
  rightItems: DispatchItem[],
) {
  if (leftItems.length !== rightItems.length) {
    return false;
  }

  return leftItems.every((item, index) => {
    const matchingItem = rightItems[index];
    if (!matchingItem) {
      return false;
    }

    return (
      item.inventoryLotId === matchingItem.inventoryLotId &&
      areQuantitiesEqual(item.quantityDispatched, matchingItem.quantityDispatched)
    );
  });
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

function getLotOptionLabel(lot: InventoryLotOption) {
  return `${lot.productName} - ${lot.lotNumber} (${formatWeight(lot.quantity)})`;
}

function getBaseDefaultValues(): BaseDispatchFormValues {
  return {
    dispatchDate: new Date(),
    requestedQuantity: 0,
    customerId: "",
    ticketNumber: "",
    items: [],
  };
}

function getByProductDefaultValues(): ByProductFormValues {
  return {
    productId: "",
    ...getBaseDefaultValues(),
  };
}

function getDispatchMetrics(
  sortedAvailableLots: InventoryLotOption[],
  dispatchItems: DispatchItem[],
  requestedQuantitySafe: number,
): DispatchMetrics {
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

  return {
    assignedQuantity,
    totalAvailableQuantity,
    remainingToAssign,
    isShortOnStock:
      requestedQuantitySafe - totalAvailableQuantity > QUANTITY_TOLERANCE,
    isOverAssigned: remainingToAssign < 0,
  };
}

function getAvailableOptionsForRow(
  dispatchItems: DispatchItem[],
  sortedAvailableLots: InventoryLotOption[],
  index: number,
) {
  const selectedIds = new Set(
    dispatchItems
      .map((item, itemIndex) =>
        itemIndex === index ? null : item?.inventoryLotId,
      )
      .filter((value): value is string => Boolean(value)),
  );

  return sortedAvailableLots.filter((lot) => !selectedIds.has(lot._id));
}

function validateItems<T extends SharedDispatchFormValues>({
  data,
  form,
  sortedAvailableLots,
  totalAvailableQuantity,
}: {
  data: T;
  form: UseFormReturn<T>;
  sortedAvailableLots: InventoryLotOption[];
  totalAvailableQuantity: number;
}) {
  form.clearErrors("items" as any);

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
      form.setError(`items.${index}.inventoryLotId` as any, {
        type: "manual",
        message: "No puede repetir el mismo tiquete.",
      });
      toast.error("No puede repetir el mismo tiquete en el despacho.");
      return false;
    }
    usedLots.add(item.inventoryLotId);

    const selectedLot = sortedAvailableLots.find(
      (lot) => lot._id === item.inventoryLotId,
    );
    if (!selectedLot) {
      form.setError(`items.${index}.inventoryLotId` as any, {
        type: "manual",
        message: "El tiquete seleccionado ya no está disponible.",
      });
      toast.error("Uno de los tiquetes seleccionados ya no está disponible.");
      return false;
    }

    if (item.quantityDispatched <= QUANTITY_TOLERANCE) {
      form.setError(`items.${index}.quantityDispatched` as any, {
        type: "manual",
        message: "La cantidad debe ser mayor que cero.",
      });
      toast.error("Cada tiquete debe tener una cantidad mayor que cero.");
      return false;
    }

    if (item.quantityDispatched - selectedLot.quantity > QUANTITY_TOLERANCE) {
      form.setError(`items.${index}.quantityDispatched` as any, {
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

export default function CreateDispatchFlow() {
  const [isCreating, setIsCreating] = useState(false);
  const [activeMode, setActiveMode] = useState<DispatchMode>("finishedGoods");
  const organization = useQuery(api.organizations.getOrg);
  const orgId = organization?._id;
  const customers = useQuery(
    api.customers.getCustomers,
    orgId ? { organizationId: orgId } : "skip",
  ) as CustomerOption[] | undefined;

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

      {isCreating && (
        <div className="w-full border border-primary rounded-lg p-7 mt-3 space-y-6">
          <div className="inline-flex flex-wrap gap-2 rounded-lg border p-1">
            <Button
              type="button"
              variant={activeMode === "finishedGoods" ? "default" : "ghost"}
              onClick={() => setActiveMode("finishedGoods")}
            >
              Despacho de productos terminados
            </Button>
            <Button
              type="button"
              variant={activeMode === "byProducts" ? "default" : "ghost"}
              onClick={() => setActiveMode("byProducts")}
            >
              Despacho de subproductos
            </Button>
          </div>

          {!orgId || customers === undefined ? (
            <div className="p-7 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : activeMode === "finishedGoods" ? (
            <FinishedGoodsDispatchForm
              key="finishedGoods"
              orgId={orgId}
              customers={customers}
            />
          ) : (
            <ByProductDispatchForm
              key="byProducts"
              orgId={orgId}
              customers={customers}
            />
          )}
        </div>
      )}
    </div>
  );
}

function FinishedGoodsDispatchForm({
  orgId,
  customers,
}: {
  orgId: Id<"organizations">;
  customers: CustomerOption[];
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createDispatch = useMutation(api.dispatches.createDispatch);
  const form = useForm<FinishedGoodsFormValues>({
    resolver: zodResolver(finishedGoodsFormSchema),
    defaultValues: getBaseDefaultValues(),
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "items",
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
    (api as any).inventory.getLotsForDispatch,
    orgId
      ? {
          organizationId: orgId,
          productType: "Finished Good",
        }
      : "skip",
  ) as InventoryLotOption[] | undefined;

  const sortedAvailableLots = useMemo(
    () => sortLotsForDispatch(availableLots ?? []),
    [availableLots],
  );
  const requestedQuantitySafe = requestedQuantity ?? 0;
  const metrics = getDispatchMetrics(
    sortedAvailableLots,
    dispatchItems,
    requestedQuantitySafe,
  );

  useEffect(() => {
    if (requestedQuantitySafe <= 0 || !availableLots) {
      if (dispatchItems.length > 0) {
        replace([]);
      }
      return;
    }

    const suggestedItems = buildSuggestedItems(
      sortedAvailableLots,
      requestedQuantitySafe,
    );

    if (!areDispatchItemsEqual(dispatchItems, suggestedItems)) {
      replace(suggestedItems);
    }
  }, [
    availableLots,
    dispatchItems,
    replace,
    requestedQuantitySafe,
    sortedAvailableLots,
  ]);

  function getLotById(lotId: string) {
    return sortedAvailableLots.find((lot) => lot._id === lotId);
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
      metrics.remainingToAssign > 0
        ? Math.min(firstUnusedLot.quantity, metrics.remainingToAssign)
        : 0;

    append({
      inventoryLotId: firstUnusedLot._id,
      quantityDispatched: quantityToPrefill,
    });
  }

  async function onSubmit(data: FinishedGoodsFormValues) {
    if (
      !validateItems({
        data,
        form,
        sortedAvailableLots,
        totalAvailableQuantity: metrics.totalAvailableQuantity,
      })
    ) {
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
      form.reset(getBaseDefaultValues());
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Error al crear el despacho.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (availableLots === undefined) {
    return (
      <div className="p-7 flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  let statusMessage: string | null = null;
  if (sortedAvailableLots.length === 0) {
    statusMessage = "No hay tiquetes activos disponibles para productos terminados.";
  } else if (fields.length === 0) {
    statusMessage = "Ingrese una cantidad para generar la propuesta automática.";
  }

  return (
    <DispatchFormBody
      form={form}
      contextField={
        <div className="space-y-2">
          <p className="text-sm font-medium">Cobertura</p>
          <div className="flex min-h-[86px] rounded-md border bg-muted/30 px-4 py-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Todos los productos terminados activos
              </p>
              <p className="text-sm text-muted-foreground">
                El sistema combinará los tiquetes disponibles necesarios para
                completar la cantidad solicitada.
              </p>
            </div>
          </div>
        </div>
      }
      customers={customers}
      fields={fields}
      dispatchItems={dispatchItems}
      sortedAvailableLots={sortedAvailableLots}
      requestedQuantitySafe={requestedQuantitySafe}
      metrics={metrics}
      canSelectLots={true}
      statusMessage={statusMessage}
      isSubmitting={isSubmitting}
      onSubmit={onSubmit}
      applySuggestedItems={applySuggestedItems}
      handleAddItem={handleAddItem}
      getLotById={getLotById}
      getAvailableOptionsForRow={(index) =>
        getAvailableOptionsForRow(dispatchItems, sortedAvailableLots, index)
      }
      removeItem={remove}
    />
  );
}

function ByProductDispatchForm({
  orgId,
  customers,
}: {
  orgId: Id<"organizations">;
  customers: CustomerOption[];
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createDispatch = useMutation(api.dispatches.createDispatch);
  const byProducts = useQuery(api.products.getProductsByType, {
    organizationId: orgId,
    type: "By-product",
  });
  const form = useForm<ByProductFormValues>({
    resolver: zodResolver(byProductFormSchema),
    defaultValues: getByProductDefaultValues(),
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
    (api as any).inventory.getLotsForDispatch,
    selectedProductId && orgId
      ? {
          organizationId: orgId,
          productType: "By-product",
          productId: selectedProductId as Id<"products">,
        }
      : "skip",
  ) as InventoryLotOption[] | undefined;

  const sortedAvailableLots = useMemo(
    () => sortLotsForDispatch(availableLots ?? []),
    [availableLots],
  );
  const requestedQuantitySafe = requestedQuantity ?? 0;
  const metrics = getDispatchMetrics(
    sortedAvailableLots,
    dispatchItems,
    requestedQuantitySafe,
  );

  useEffect(() => {
    if (!selectedProductId || requestedQuantitySafe <= 0 || !availableLots) {
      if (dispatchItems.length > 0) {
        replace([]);
      }
      return;
    }

    const suggestedItems = buildSuggestedItems(
      sortedAvailableLots,
      requestedQuantitySafe,
    );

    if (!areDispatchItemsEqual(dispatchItems, suggestedItems)) {
      replace(suggestedItems);
    }
  }, [
    availableLots,
    dispatchItems,
    replace,
    requestedQuantitySafe,
    selectedProductId,
    sortedAvailableLots,
  ]);

  function getLotById(lotId: string) {
    return sortedAvailableLots.find((lot) => lot._id === lotId);
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
      metrics.remainingToAssign > 0
        ? Math.min(firstUnusedLot.quantity, metrics.remainingToAssign)
        : 0;

    append({
      inventoryLotId: firstUnusedLot._id,
      quantityDispatched: quantityToPrefill,
    });
  }

  async function onSubmit(data: ByProductFormValues) {
    if (
      !validateItems({
        data,
        form,
        sortedAvailableLots,
        totalAvailableQuantity: metrics.totalAvailableQuantity,
      })
    ) {
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
      form.reset(getByProductDefaultValues());
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Error al crear el despacho.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!byProducts || (selectedProductId && availableLots === undefined)) {
    return (
      <div className="p-7 flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  let statusMessage: string | null = null;
  if (!selectedProductId) {
    statusMessage = "Seleccione un subproducto para generar la propuesta.";
  } else if (sortedAvailableLots.length === 0) {
    statusMessage = "No hay tiquetes activos disponibles para este subproducto.";
  } else if (fields.length === 0) {
    statusMessage = "Ingrese una cantidad para generar la propuesta automática.";
  }

  return (
    <DispatchFormBody
      form={form}
      contextField={
        <FormField
          control={form.control}
          name="productId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Subproducto <span className="text-destructive">*</span>
              </FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  form.clearErrors("items");
                }}
                value={field.value}
                disabled={byProducts.length === 0}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccione un subproducto..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {byProducts.map((product) => (
                    <SelectItem key={product._id} value={product._id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {byProducts.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No hay subproductos creados. Cree uno desde Gestión de Productos.
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      }
      customers={customers}
      fields={fields}
      dispatchItems={dispatchItems}
      sortedAvailableLots={sortedAvailableLots}
      requestedQuantitySafe={requestedQuantitySafe}
      metrics={metrics}
      canSelectLots={Boolean(selectedProductId)}
      statusMessage={statusMessage}
      isSubmitting={isSubmitting}
      onSubmit={onSubmit}
      applySuggestedItems={applySuggestedItems}
      handleAddItem={handleAddItem}
      getLotById={getLotById}
      getAvailableOptionsForRow={(index) =>
        getAvailableOptionsForRow(dispatchItems, sortedAvailableLots, index)
      }
      removeItem={remove}
    />
  );
}

function DispatchFormBody({
  form,
  contextField,
  customers,
  fields,
  dispatchItems,
  sortedAvailableLots,
  requestedQuantitySafe,
  metrics,
  canSelectLots,
  statusMessage,
  isSubmitting,
  onSubmit,
  applySuggestedItems,
  handleAddItem,
  getLotById,
  getAvailableOptionsForRow,
  removeItem,
}: DispatchFormBodyProps) {
  const today = toLocalCalendarDate(new Date());

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-3">
          {contextField}

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

        <DispatchItemsEditor
          form={form}
          fields={fields}
          dispatchItems={dispatchItems}
          sortedAvailableLots={sortedAvailableLots}
          requestedQuantitySafe={requestedQuantitySafe}
          metrics={metrics}
          canSelectLots={canSelectLots}
          statusMessage={statusMessage}
          applySuggestedItems={applySuggestedItems}
          handleAddItem={handleAddItem}
          getLotById={getLotById}
          getAvailableOptionsForRow={getAvailableOptionsForRow}
          removeItem={removeItem}
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
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
                    <SelectTrigger className="w-full">
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
            !areQuantitiesEqual(
              metrics.assignedQuantity,
              requestedQuantitySafe,
            ) ||
            metrics.isShortOnStock
          }
          className="w-full md:w-auto"
        >
          {isSubmitting ? <LoadingSpinner /> : "Crear Despacho"}
        </Button>
      </form>
    </Form>
  );
}

function DispatchItemsEditor({
  form,
  fields,
  dispatchItems,
  sortedAvailableLots,
  requestedQuantitySafe,
  metrics,
  canSelectLots,
  statusMessage,
  applySuggestedItems,
  handleAddItem,
  getLotById,
  getAvailableOptionsForRow,
  removeItem,
}: {
  form: UseFormReturn<any>;
  fields: FieldArrayWithId<any, "items", "id">[];
  dispatchItems: DispatchItem[];
  sortedAvailableLots: InventoryLotOption[];
  requestedQuantitySafe: number;
  metrics: DispatchMetrics;
  canSelectLots: boolean;
  statusMessage: string | null;
  applySuggestedItems: () => void;
  handleAddItem: () => void;
  getLotById: (lotId: string) => InventoryLotOption | undefined;
  getAvailableOptionsForRow: (index: number) => InventoryLotOption[];
  removeItem: (index: number) => void;
}) {
  return (
    <div className="rounded-lg border border-dashed p-4 space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium">Selección de tiquetes</p>
          <p className="text-sm text-muted-foreground">
            Revise la propuesta y ajuste los tiquetes si lo necesita antes de guardar.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={applySuggestedItems}
            disabled={
              !canSelectLots ||
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
            disabled={!canSelectLots || sortedAvailableLots.length === 0}
          >
            <PlusIcon className="size-4 mr-2" />
            Agregar tiquete
          </Button>
        </div>
      </div>

      {statusMessage && (
        <p className="text-sm text-muted-foreground">{statusMessage}</p>
      )}

      {fields.map((itemField, index) => {
        const selectedLotId = dispatchItems[index]?.inventoryLotId ?? "";
        const selectedLot = getLotById(selectedLotId);
        const availableOptions = getAvailableOptionsForRow(index);
        const productionCharacteristics = getProductionCharacteristicLabel(
          selectedLot?.productionCharacteristics,
        );

        return (
          <div key={itemField.id} className="rounded-lg border p-4 space-y-4">
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
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccione un tiquete..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableOptions.map((lot) => (
                          <SelectItem key={lot._id} value={lot._id}>
                            {getLotOptionLabel(lot)}
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
                  onClick={() => removeItem(index)}
                >
                  <Trash2Icon className="size-4 mr-2" />
                  Quitar
                </Button>
              </div>
            </div>

            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <p className="text-sm font-medium">
                Producto: {selectedLot?.productName ?? "Seleccione un tiquete"}
              </p>
              <div>
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
          <span className="font-medium">
            {formatWeight(metrics.assignedQuantity)}
          </span>
        </div>
        <div className="flex flex-col gap-1 text-sm md:flex-row md:items-center md:justify-between">
          <span>Stock disponible</span>
          <span className="font-medium">
            {formatWeight(metrics.totalAvailableQuantity)}
          </span>
        </div>
        <p
          className={cn(
            "text-sm",
            metrics.isShortOnStock ||
              metrics.isOverAssigned ||
              metrics.remainingToAssign > 0
              ? "text-destructive"
              : "text-emerald-700",
          )}
        >
          {metrics.isShortOnStock
            ? `Faltan ${formatWeight(requestedQuantitySafe - metrics.totalAvailableQuantity)} para cubrir el despacho con el stock actual.`
            : metrics.isOverAssigned
              ? `La propuesta supera lo solicitado por ${formatWeight(Math.abs(metrics.remainingToAssign))}.`
              : metrics.remainingToAssign > 0
                ? `Faltan ${formatWeight(metrics.remainingToAssign)} por asignar.`
                : requestedQuantitySafe > 0
                  ? "La propuesta cubre exactamente la cantidad solicitada."
                  : "Ingrese una cantidad para generar la propuesta."}
        </p>
      </div>
    </div>
  );
}
