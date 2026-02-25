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
import { useMemo, useState } from "react";
import { LoadingSpinner } from "@/assets/icons/LoadingSpinner";
import { convertFromCanonical, convertToCanonical, WeightUnit } from "@/lib/units";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp, SquarePen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PaginationControls } from "../bodega/PaginationControls";
import { formatNumber } from "@/lib/utils";
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
  runDate: number;
  inputProductName: string;
  inputLotNumber: string;
  quantityConsumed: number;
  inputUnit: string;
  outputs: {
    _id: Id<"productionOutputs">;
    productId: Id<"products">;
    productName: string;
    quantityProduced: number;
    resultingInventoryLotId?: Id<"inventoryLots">;
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
  quantityConsumed: { value: number; unit: string };
  outputProduct: string;
  quantityProduced: { value: number; unit: string };
  newLotNumber: string;
  qualityFactors: { name: string; value: string }[];
};

type ProductionEntryRow = {
  runId: Id<"productionRuns">;
  runDate: number;
  inputProductName: string;
  inputLotNumber: string;
  quantityConsumed: { value: number; unit: string };
  outputsCount: number;
};

const outputColumnHelper = createColumnHelper<FlatProductionHistoryRow>();
const entryColumnHelper = createColumnHelper<ProductionEntryRow>();

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
      runDate: run.runDate,
      inputProductName: run.inputProductName,
      inputLotNumber: run.inputLotNumber,
      quantityConsumed: {
        value: run.quantityConsumed,
        unit: run.inputUnit,
      },
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
          <EditProductionEntryDialog
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

  const exportRows = viewMode === "entries" ? entryData : outputData;
  const exportColumns =
    viewMode === "entries"
      ? [
          {
            header: "Fecha",
            value: (row: ProductionEntryRow) =>
              new Date(row.runDate).toLocaleDateString(),
          },
          { header: "Producto Entrada", value: (row: ProductionEntryRow) => row.inputProductName },
          { header: "Lote Entrada", value: (row: ProductionEntryRow) => row.inputLotNumber },
          {
            header: "Cantidad Consumida (kg)",
            value: (row: ProductionEntryRow) =>
              formatNumber(
                convertFromCanonical(
                  row.quantityConsumed.value,
                  row.quantityConsumed.unit as WeightUnit,
                ),
              ),
          },
          { header: "No. Salidas", value: (row: ProductionEntryRow) => row.outputsCount },
        ]
      : [
          {
            header: "Fecha",
            value: (row: FlatProductionHistoryRow) =>
              new Date(row.runDate).toLocaleDateString(),
          },
          { header: "Producto Entrada", value: (row: FlatProductionHistoryRow) => row.inputProductName },
          { header: "Lote Entrada", value: (row: FlatProductionHistoryRow) => row.inputLotNumber },
          {
            header: "Cantidad Consumida (kg)",
            value: (row: FlatProductionHistoryRow) =>
              formatNumber(
                convertFromCanonical(
                  row.quantityConsumed.value,
                  row.quantityConsumed.unit as WeightUnit,
                ),
              ),
          },
          { header: "Producto Salida", value: (row: FlatProductionHistoryRow) => row.outputProduct },
          {
            header: "Cantidad Producida (kg)",
            value: (row: FlatProductionHistoryRow) =>
              formatNumber(
                convertFromCanonical(
                  row.quantityProduced.value,
                  row.quantityProduced.unit as WeightUnit,
                ),
              ),
          },
          { header: "Nuevo Lote", value: (row: FlatProductionHistoryRow) => row.newLotNumber },
          {
            header: "Factores de Calidad",
            value: (row: FlatProductionHistoryRow) =>
              row.qualityFactors.length > 0
                ? row.qualityFactors.map((factor) => `${factor.name}: ${factor.value}`).join(" | ")
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
        <ExportActions
          organizationId={orgId}
          moduleName={
            viewMode === "entries"
              ? "historial_produccion_entradas"
              : "historial_produccion_salidas"
          }
          fileBaseName={
            viewMode === "entries"
              ? "historial-produccion-entradas"
              : "historial-produccion-salidas"
          }
          rows={exportRows as any[]}
          columns={exportColumns as any}
        />
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

function EditProductionEntryDialog({
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
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo actualizar la producción.");
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
