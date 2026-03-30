"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  type Table as TanStackTable,
  useReactTable,
} from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { LoadingSpinner } from "@/assets/icons/LoadingSpinner";
import { convertFromCanonical, convertToCanonical, WeightUnit } from "@/lib/units";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp, SquarePen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PaginationControls } from "../bodega/PaginationControls";
import { formatNumber } from "@/lib/utils";
import type { ExportColumn } from "@/lib/export-utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExportActions } from "../exportaciones/ExportActions";

type ProductionHistoryRow = {
  _id: Id<"productionRuns">;
  inputLotId: Id<"inventoryLots">;
  inputProductId?: Id<"products">;
  runDate: number;
  inputProductName: string;
  inputLotNumber: string;
  quantityConsumed: number;
  inputUnit: string;
  notes?: string;
  outputs: {
    _id: Id<"productionOutputs">;
    productId: Id<"products">;
    productName: string;
    quantityProduced: number;
    resultingInventoryLotId?: Id<"inventoryLots">;
    outputType: "standard" | "merma";
    warehouseId?: Id<"warehouse">;
    newLotNumber: string;
    unit: string;
    qualityFactors: { name: string; value: string }[];
  }[];
};

type FlatProductionHistoryRow = {
  runId: Id<"productionRuns">;
  inputLotId: Id<"inventoryLots">;
  productionOutputId: Id<"productionOutputs">;
  outputLotId?: Id<"inventoryLots">;
  outputWarehouseId?: Id<"warehouse">;
  runDate: number;
  inputProductName: string;
  inputLotNumber: string;
  outputType: "standard" | "merma";
  quantityConsumed: { value: number; unit: string };
  outputProduct: string;
  quantityProduced: { value: number; unit: string };
  newLotNumber: string;
  qualityFactors: { name: string; value: string }[];
};

type ProductionEntryRow = {
  runId: Id<"productionRuns">;
  inputLotId: Id<"inventoryLots">;
  inputProductId?: Id<"products">;
  runDate: number;
  inputProductName: string;
  inputLotNumber: string;
  quantityConsumed: { value: number; unit: string };
  notes?: string;
  outputsCount: number;
};

const outputColumnHelper = createColumnHelper<FlatProductionHistoryRow>();
const entryColumnHelper = createColumnHelper<ProductionEntryRow>();
const OUTPUT_TYPE_LABELS = {
  standard: "No",
  merma: "Sí",
} as const;

export default function ProductionHistoryTable() {
  const organization = useQuery(api.organizations.getOrg);
  const orgId = organization?._id;

  const historyData = useQuery(
    api.production.getProductionHistory,
    orgId ? { organizationId: orgId } : "skip",
  );
  const warehouses = useQuery(api.warehouse.getAvailableWarehouse);

  const outputData = useMemo(() => {
    if (!historyData) return [];
    return historyData.flatMap((run: ProductionHistoryRow) =>
      run.outputs.map((output) => ({
        runId: run._id,
        inputLotId: run.inputLotId,
        productionOutputId: output._id,
        outputLotId: output.resultingInventoryLotId,
        outputWarehouseId: output.warehouseId,
        runDate: run.runDate,
        inputProductName: run.inputProductName,
        inputLotNumber: run.inputLotNumber,
        outputType: output.outputType,
        quantityConsumed: {
          value: run.quantityConsumed,
          unit: run.inputUnit,
        },
        outputProduct: output.productName,
        quantityProduced: {
          value: output.quantityProduced,
          unit: output.unit,
        },
        newLotNumber: output.newLotNumber,
        qualityFactors: output.qualityFactors,
      })),
    );
  }, [historyData]);

  const entryData = useMemo(() => {
    if (!historyData) return [];
    return historyData.map((run: ProductionHistoryRow) => ({
      runId: run._id,
      inputLotId: run.inputLotId,
      inputProductId: run.inputProductId,
      runDate: run.runDate,
      inputProductName: run.inputProductName,
      inputLotNumber: run.inputLotNumber,
      quantityConsumed: {
        value: run.quantityConsumed,
        unit: run.inputUnit,
      },
      notes: run.notes,
      outputsCount: run.outputs.length,
    }));
  }, [historyData]);

  const [viewMode, setViewMode] = useState<"entries" | "outputs">("entries");
  const [globalFilter, setGlobalFilter] = useState("");
  const [entrySorting, setEntrySorting] = useState<SortingState>([]);
  const [outputSorting, setOutputSorting] = useState<SortingState>([]);

  const outputColumns = useMemo(
    () => [
      outputColumnHelper.accessor("runDate", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Fecha
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
              <ArrowDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: (info) => new Date(info.getValue()).toLocaleDateString(),
      }),
      outputColumnHelper.accessor("inputProductName", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Entrada
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
              <ArrowDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: (info) => info.getValue(),
      }),
      outputColumnHelper.accessor("inputLotNumber", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Lote Entrada
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
              <ArrowDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: (info) => info.getValue(),
      }),
      outputColumnHelper.accessor("quantityConsumed", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Cant. Consumida (kg)
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
              <ArrowDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        sortingFn: (rowA, rowB, columnId) => {
          const a = rowA.getValue<{ value: number }>(columnId).value;
          const b = rowB.getValue<{ value: number }>(columnId).value;
          return a - b;
        },
        cell: (info) => {
          const { value, unit } = info.getValue();
          const displayValue = formatNumber(
            convertFromCanonical(value, unit as WeightUnit),
          );
          return <p className="w-full text-right tabular-nums">{displayValue}</p>;
        },
      }),
      outputColumnHelper.accessor("outputProduct", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Salida
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
              <ArrowDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: (info) => info.getValue(),
      }),
      outputColumnHelper.accessor("outputType", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Merma
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
              <ArrowDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: (info) => OUTPUT_TYPE_LABELS[info.getValue()],
      }),
      outputColumnHelper.accessor("quantityProduced", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Cant. Producida (kg)
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
              <ArrowDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        sortingFn: (rowA, rowB, columnId) => {
          const a = rowA.getValue<{ value: number }>(columnId).value;
          const b = rowB.getValue<{ value: number }>(columnId).value;
          return a - b;
        },
        cell: (info) => {
          const { value, unit } = info.getValue();
          const displayValue = formatNumber(
            convertFromCanonical(value, unit as WeightUnit),
          );
          return <p className="w-full text-right tabular-nums">{displayValue}</p>;
        },
      }),
      outputColumnHelper.accessor("newLotNumber", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Nuevo Lote
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
              <ArrowDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: (info) => info.getValue(),
      }),
      outputColumnHelper.accessor("qualityFactors", {
        header: "Factores de Calidad",
        cell: (info) => {
          const factors = info.getValue();
          if (factors.length === 0) return "N/A";
          return (
            <ul className="list-disc list-inside">
              {factors.map((f) => (
                <li key={f.name}>{`${f.name}: ${f.value}`}</li>
              ))}
            </ul>
          );
        },
        enableSorting: false,
      }),
      outputColumnHelper.display({
        id: "actions",
        header: "Acciones",
        cell: ({ row }) => (
          <EditProductionOutputDialog
            entry={row.original}
            warehouses={warehouses ?? []}
          />
        ),
      }),
    ],
    [warehouses],
  );

  const entryColumns = useMemo(
    () => [
      entryColumnHelper.accessor("runDate", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Fecha
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
              <ArrowDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: (info) => new Date(info.getValue()).toLocaleDateString(),
      }),
      entryColumnHelper.accessor("inputProductName", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Entrada
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
              <ArrowDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: (info) => info.getValue(),
      }),
      entryColumnHelper.accessor("inputLotNumber", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Lote Entrada
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
              <ArrowDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: (info) => info.getValue(),
      }),
      entryColumnHelper.accessor("quantityConsumed", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Cant. Consumida (kg)
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
              <ArrowDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        sortingFn: (rowA, rowB, columnId) => {
          const a = rowA.getValue<{ value: number }>(columnId).value;
          const b = rowB.getValue<{ value: number }>(columnId).value;
          return a - b;
        },
        cell: (info) => {
          const { value, unit } = info.getValue();
          const displayValue = formatNumber(
            convertFromCanonical(value, unit as WeightUnit),
          );
          return <p className="w-full text-right tabular-nums">{displayValue}</p>;
        },
      }),
      entryColumnHelper.accessor("outputsCount", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            No. Salidas
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
              <ArrowDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: (info) => <p className="w-full text-right tabular-nums">{info.getValue()}</p>,
      }),
      entryColumnHelper.display({
        id: "actions",
        header: "Acciones",
        cell: ({ row }) => <EditProductionRunEntryDialog entry={row.original} />,
      }),
    ],
    [],
  );

  const entryTable = useReactTable({
    data: entryData,
    columns: entryColumns,
    state: {
      sorting: entrySorting,
      globalFilter,
    },
    onSortingChange: setEntrySorting,
    getSortedRowModel: getSortedRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const outputTable = useReactTable({
    data: outputData,
    columns: outputColumns,
    state: {
      sorting: outputSorting,
      globalFilter,
    },
    onSortingChange: setOutputSorting,
    getSortedRowModel: getSortedRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (historyData === undefined || warehouses === undefined) {
    return (
      <div className="w-full mt-8 p-6 flex justify-center items-center border rounded-lg shadow-sm">
        <LoadingSpinner />
      </div>
    );
  }

  if (entryData.length === 0 && outputData.length === 0) {
    return (
      <div className="mt-8 flow-root">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold leading-7 text-gray-900 sm:truncate sm:text-2xl sm:tracking-tight">
            Historial de Producción
          </h2>
        </div>
        <div className="w-full mt-8 p-6 flex justify-center items-center border rounded-lg shadow-sm">
          <p className="text-sm text-gray-500">
            No hay historial de producción para mostrar.
          </p>
        </div>
      </div>
    );
  }

  const entryExportColumns: ExportColumn<ProductionEntryRow>[] = [
    {
      header: "Fecha",
      value: (row) => new Date(row.runDate).toLocaleDateString(),
    },
    { header: "Producto Entrada", value: (row) => row.inputProductName },
    { header: "Lote Entrada", value: (row) => row.inputLotNumber },
    {
      header: "Cantidad Consumida (kg)",
      value: (row) =>
        formatNumber(
          convertFromCanonical(
            row.quantityConsumed.value,
            row.quantityConsumed.unit as WeightUnit,
          ),
        ),
    },
    { header: "No. Salidas", value: (row) => row.outputsCount },
  ];

  const outputExportColumns: ExportColumn<FlatProductionHistoryRow>[] = [
    {
      header: "Fecha",
      value: (row) => new Date(row.runDate).toLocaleDateString(),
    },
    { header: "Producto Entrada", value: (row) => row.inputProductName },
    { header: "Lote Entrada", value: (row) => row.inputLotNumber },
    {
      header: "Cantidad Consumida (kg)",
      value: (row) =>
        formatNumber(
          convertFromCanonical(
            row.quantityConsumed.value,
            row.quantityConsumed.unit as WeightUnit,
          ),
        ),
    },
    { header: "Producto Salida", value: (row) => row.outputProduct },
    {
      header: "Merma",
      value: (row) => OUTPUT_TYPE_LABELS[row.outputType],
    },
    {
      header: "Cantidad Producida (kg)",
      value: (row) =>
        formatNumber(
          convertFromCanonical(
            row.quantityProduced.value,
            row.quantityProduced.unit as WeightUnit,
          ),
        ),
    },
    { header: "Nuevo Lote", value: (row) => row.newLotNumber },
    {
      header: "Factores de Calidad",
      value: (row) =>
        row.qualityFactors.length > 0
          ? row.qualityFactors
              .map((factor) => `${factor.name}: ${factor.value}`)
              .join(" | ")
          : "N/A",
    },
  ];

  return (
    <div className="mt-8 flow-root">
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          variant={viewMode === "entries" ? "default" : "outline"}
          onClick={() => setViewMode("entries")}
        >
          Entradas
        </Button>
        <Button
          variant={viewMode === "outputs" ? "default" : "outline"}
          onClick={() => setViewMode("outputs")}
        >
          Salidas
        </Button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <Input
          placeholder={
            viewMode === "entries"
              ? "Buscar en entradas de producción..."
              : "Buscar en salidas de producción..."
          }
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-lg"
        />
        {viewMode === "entries" ? (
          <ExportActions
            organizationId={orgId}
            moduleName="historial_produccion_entradas"
            fileBaseName="historial-produccion-entradas"
            rows={entryData}
            columns={entryExportColumns}
          />
        ) : (
          <ExportActions
            organizationId={orgId}
            moduleName="historial_produccion_salidas"
            fileBaseName="historial-produccion-salidas"
            rows={outputData}
            columns={outputExportColumns}
          />
        )}
      </div>
      {viewMode === "entries" ? (
        <ProductionHistoryDataTable table={entryTable} />
      ) : (
        <ProductionHistoryDataTable table={outputTable} />
      )}
    </div>
  );
}

function ProductionHistoryDataTable<TData>({
  table,
}: {
  table: TanStackTable<TData>;
}) {
  return (
    <div className="overflow-hidden shadow ring-1 ring-[#ebebeb] ring-opacity-5 sm:rounded-lg">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-[#f9f9f9]">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="text-gray">
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <PaginationControls table={table} />
    </div>
  );
}

function EditProductionRunEntryDialog({
  entry,
}: {
  entry: ProductionEntryRow;
}) {
  const organization = useQuery(api.organizations.getOrg);
  const orgId = organization?._id;
  const producibleStock = useQuery(
    api.inventory.getProducibleStock,
    orgId ? { organizationId: orgId } : "skip",
  );
  const editProductionRunEntry = useMutation(api.production.editProductionRunEntry);

  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>(
    entry.inputProductId ?? "",
  );
  const [selectedLotId, setSelectedLotId] = useState<string>(entry.inputLotId);
  const [quantityConsumedKg, setQuantityConsumedKg] = useState<string>(
    String(convertFromCanonical(entry.quantityConsumed.value, "kg")),
  );
  const [notes, setNotes] = useState(entry.notes ?? "");

  useEffect(() => {
    if (!open) return;
    setSelectedProductId(entry.inputProductId ?? "");
    setSelectedLotId(entry.inputLotId);
    setQuantityConsumedKg(String(convertFromCanonical(entry.quantityConsumed.value, "kg")));
    setNotes(entry.notes ?? "");
  }, [entry, open]);

  const productOptions = [...(producibleStock ?? [])];
  if (
    entry.inputProductId &&
    !productOptions.some((product) => product._id === entry.inputProductId)
  ) {
    productOptions.unshift({
      _id: entry.inputProductId,
      name: entry.inputProductName,
    } as (typeof productOptions)[number]);
  }

  const availableLots = useQuery(
    api.inventory.getLotsForProduct,
    selectedProductId && orgId
      ? {
          productId: selectedProductId as Id<"products">,
          organizationId: orgId,
          includeLotId:
            selectedProductId === entry.inputProductId ? entry.inputLotId : undefined,
        }
      : "skip",
  );

  const selectedLot = availableLots?.find((lot) => lot._id === selectedLotId);
  const isCurrentInputLot = selectedLot?._id === entry.inputLotId;
  const sourceFieldsLocked = entry.outputsCount > 0;
  const availableQuantity = selectedLot
    ? isCurrentInputLot
      ? selectedLot.quantity + entry.quantityConsumed.value
      : selectedLot.quantity
    : 0;
  const disabledReason = !entry.inputProductId
    ? "No se pudo identificar el producto de entrada."
    : undefined;

  const handleProductChange = (value: string) => {
    setSelectedProductId(value);
    setSelectedLotId(value === entry.inputProductId ? entry.inputLotId : "");
  };

  const handleSave = async () => {
    if (!sourceFieldsLocked && (!selectedProductId || !selectedLotId)) {
      toast.error("Debe seleccionar un producto y un lote de entrada.");
      return;
    }

    const parsedConsumed = sourceFieldsLocked
      ? convertFromCanonical(entry.quantityConsumed.value, "kg")
      : Number(quantityConsumedKg);

    if (!sourceFieldsLocked && (!Number.isFinite(parsedConsumed) || parsedConsumed <= 0)) {
      toast.error("La cantidad consumida debe ser mayor que cero.");
      return;
    }

    if (
      !sourceFieldsLocked &&
      (!selectedLot || convertToCanonical(parsedConsumed, "kg") > availableQuantity)
    ) {
      toast.error(
        `La cantidad no puede ser mayor que la disponible (${formatNumber(
          convertFromCanonical(availableQuantity, "kg"),
        )} kg).`,
      );
      return;
    }

    try {
      setIsSaving(true);
      await editProductionRunEntry({
        productionRunId: entry.runId,
        inputLotId: (sourceFieldsLocked ? entry.inputLotId : selectedLotId) as Id<"inventoryLots">,
        quantityConsumed: convertToCanonical(parsedConsumed, "kg"),
        notes: notes.trim() ? notes.trim() : undefined,
      });
      toast.success("Entrada de producción actualizada correctamente.");
      setOpen(false);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar la entrada de producción.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={Boolean(disabledReason)}
          title={disabledReason}
        >
          <SquarePen className="size-4 text-primary" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Modificar Entrada de Producción</DialogTitle>
        </DialogHeader>
        {sourceFieldsLocked && (
          <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Esta entrada ya tiene salidas registradas. Para proteger la trazabilidad,
            producto, lote y cantidad consumida quedan bloqueados. Solo puedes editar
            las notas.
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm mb-2">Producto de Entrada</p>
            <Select
              value={selectedProductId}
              onValueChange={handleProductChange}
              disabled={sourceFieldsLocked}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un producto..." />
              </SelectTrigger>
              <SelectContent>
                {productOptions.map((product) => (
                  <SelectItem key={product._id} value={product._id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="text-sm mb-2">No Tiquete</p>
            <Select
              value={selectedLotId}
              onValueChange={setSelectedLotId}
              disabled={sourceFieldsLocked}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={!availableLots ? "Cargando..." : "Seleccione un lote..."}
                />
              </SelectTrigger>
              <SelectContent>
                {(availableLots ?? []).map((lot) => {
                  const lotAvailableQuantity =
                    lot._id === entry.inputLotId
                      ? lot.quantity + entry.quantityConsumed.value
                      : lot.quantity;
                  return (
                    <SelectItem key={lot._id} value={lot._id}>
                      {`${lot.lotNumber} (Disp: ${formatNumber(
                        convertFromCanonical(lotAvailableQuantity, "kg"),
                      )} kg)`}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="text-sm mb-2">Cant. Consumida (kg)</p>
            <Input
              type="number"
              inputMode="decimal"
              step="any"
              value={quantityConsumedKg}
              onChange={(e) => setQuantityConsumedKg(e.target.value)}
              disabled={sourceFieldsLocked}
            />
          </div>
          <div>
            <p className="text-sm mb-2">Notas</p>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditProductionOutputDialog({
  entry,
  warehouses,
}: {
  entry: FlatProductionHistoryRow;
  warehouses: Array<{ _id: Id<"warehouse">; name: string }>;
}) {
  const editProductionOutputEntry = useMutation(
    api.production.editProductionOutputEntry,
  );

  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lotNumber, setLotNumber] = useState(entry.newLotNumber);
  const [warehouseId, setWarehouseId] = useState<string>(entry.outputWarehouseId ?? "");
  const [quantityProducedKg, setQuantityProducedKg] = useState<string>(
    String(convertFromCanonical(entry.quantityProduced.value, "kg")),
  );
  const [quantityConsumedKg, setQuantityConsumedKg] = useState<string>(
    String(convertFromCanonical(entry.quantityConsumed.value, "kg")),
  );

  const handleSave = async () => {
    if (!entry.outputLotId || !warehouseId) {
      toast.error("No se pudo identificar el lote de salida para editar.");
      return;
    }

    const parsedProduced = Number(quantityProducedKg);
    const parsedConsumed = Number(quantityConsumedKg);
    if (!Number.isFinite(parsedProduced) || parsedProduced <= 0) {
      toast.error("La cantidad producida debe ser mayor que cero.");
      return;
    }
    if (!Number.isFinite(parsedConsumed) || parsedConsumed <= 0) {
      toast.error("La cantidad consumida debe ser mayor que cero.");
      return;
    }

    try {
      setIsSaving(true);
      await editProductionOutputEntry({
        productionRunId: entry.runId,
        productionOutputId: entry.productionOutputId,
        quantityConsumed: convertToCanonical(parsedConsumed, "kg"),
        quantityProduced: convertToCanonical(parsedProduced, "kg"),
        lotNumber,
        warehouseId: warehouseId as Id<"warehouse">,
      });
      toast.success("Producción actualizada correctamente.");
      setOpen(false);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo actualizar la producción.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <SquarePen className="size-4 text-primary" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Editar Producción</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm mb-2">Cant. Consumida (kg)</p>
            <Input
              type="number"
              inputMode="decimal"
              step="any"
              value={quantityConsumedKg}
              onChange={(e) => setQuantityConsumedKg(e.target.value)}
            />
          </div>
          <div>
            <p className="text-sm mb-2">Cant. Producida (kg)</p>
            <Input
              type="number"
              inputMode="decimal"
              step="any"
              value={quantityProducedKg}
              onChange={(e) => setQuantityProducedKg(e.target.value)}
            />
          </div>
          <div>
            <p className="text-sm mb-2">Nuevo Lote</p>
            <Input value={lotNumber} onChange={(e) => setLotNumber(e.target.value)} />
          </div>
          <div>
            <p className="text-sm mb-2">Bodega salida</p>
            <Select value={warehouseId} onValueChange={setWarehouseId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione bodega" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse._id} value={warehouse._id}>
                    {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
