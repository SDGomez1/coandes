"use client";

import { useQuery } from "convex/react";
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
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { LoadingSpinner } from "@/assets/icons/LoadingSpinner";
import { convertFromCanonical, WeightUnit } from "@/lib/units";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PaginationControls } from "../bodega/PaginationControls";
import { formatNumber } from "@/lib/utils";

type ProductionHistoryRow = {
  _id: Id<"productionRuns">;
  runDate: number;
  inputProductName: string;
  inputLotNumber: string;
  quantityConsumed: number;
  inputUnit: string;
  outputs: {
    productName: string;
    quantityProduced: number;
    newLotNumber: string;
    unit: string;
    qualityFactors: { name: string; value: string }[];
  }[];
};

type FlatProductionHistoryRow = {
  runId: Id<"productionRuns">;
  runDate: number;
  inputProduct: string;
  quantityConsumed: { value: number; unit: string };
  outputProduct: string;
  quantityProduced: { value: number; unit: string };
  newLotNumber: string;
  qualityFactors: { name: string; value: string }[];
};

const columnHelper = createColumnHelper<FlatProductionHistoryRow>();

export default function ProductionHistoryTable() {
  const organization = useQuery(api.organizations.getOrg);
  const orgId = organization?._id;

  const historyData = useQuery(
    api.production.getProductionHistory,
    orgId ? { organizationId: orgId } : "skip",
  );

  const data = useMemo(() => {
    if (!historyData) return [];
    return historyData.flatMap((run) =>
      run.outputs.map((output) => ({
        runId: run._id,
        runDate: run.runDate,
        inputProduct: `${run.inputProductName} (Lote: ${run.inputLotNumber})`,
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

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("runDate", {
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
      columnHelper.accessor("inputProduct", {
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
      columnHelper.accessor("quantityConsumed", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Cant. Consumida
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
              <ArrowDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: (info) => {
          const { value, unit } = info.getValue();
          const displayValue = formatNumber(
            convertFromCanonical(value, unit as WeightUnit),
          );
          return `${displayValue} ${unit}`;
        },
        sortingFn: "alphanumeric",
      }),
      columnHelper.accessor("outputProduct", {
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
      columnHelper.accessor("quantityProduced", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Cant. Producida
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
              <ArrowDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: (info) => {
          const { value, unit } = info.getValue();
          const displayValue = formatNumber(
            convertFromCanonical(value, unit as WeightUnit),
          );
          return `${displayValue} ${unit}`;
        },
        sortingFn: "alphanumeric",
      }),
      columnHelper.accessor("newLotNumber", {
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
      columnHelper.accessor("qualityFactors", {
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
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (historyData === undefined) {
    return (
      <div className="w-full mt-8 p-6 flex justify-center items-center border rounded-lg shadow-sm">
        <LoadingSpinner />
      </div>
    );
  }

  if (data.length === 0) {
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

  return (
    <div className="mt-8 flow-root">
      <div className="flex items-center justify-between mb-4">
        <Input
          placeholder="Buscar en la producción..."
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-lg"
        />
      </div>
      <div className="overflow-hidden shadow ring-1 ring-[#ebebeb] ring-opacity-5 sm:rounded-lg">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-[#f9f9f9]">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-gray">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
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
    </div>
  );
}
