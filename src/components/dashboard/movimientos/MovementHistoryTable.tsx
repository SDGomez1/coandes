"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowDown, ArrowUp } from "lucide-react";
import { LoadingSpinner } from "@/assets/icons/LoadingSpinner";
import { PaginationControls } from "../bodega/PaginationControls";
import { convertFromCanonical } from "@/lib/units";
import { cn, formatNumber } from "@/lib/utils";

type MovementHistoryRow = {
  _id: Id<"activityLog">;
  activityType:
    | "reception"
    | "production_in"
    | "production_out"
    | "dispatch"
    | "adjustment";
  quantityChange: number;
  timestamp: number;
  relatedId?: string;
  lotId: Id<"inventoryLots">;
  lotNumber: string;
  productName: string;
  warehouseName: string;
  unit: string;
};

const columnHelper = createColumnHelper<MovementHistoryRow>();

function getActivityLabel(type: MovementHistoryRow["activityType"]) {
  switch (type) {
    case "reception":
      return "Recepcion";
    case "production_in":
      return "Produccion entrada";
    case "production_out":
      return "Produccion salida";
    case "dispatch":
      return "Despacho";
    case "adjustment":
      return "Ajuste";
    default:
      return type;
  }
}

export default function MovementHistoryTable() {
  const organization = useQuery(api.organizations.getOrg);
  const orgId = organization?._id;

  const data = useQuery(
    api.inventory.getMovementHistory,
    orgId ? { organizationId: orgId as Id<"organizations"> } : "skip",
  );

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "timestamp", desc: true },
  ]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("timestamp", {
        id: "timestamp",
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
        cell: (info) => new Date(info.getValue()).toLocaleString(),
      }),
      columnHelper.accessor("activityType", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Etapa
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
              <ArrowDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: (info) => getActivityLabel(info.getValue()),
      }),
      columnHelper.accessor("productName", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Producto
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
              <ArrowDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("warehouseName", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Bodega
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
              <ArrowDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("lotNumber", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            No. tiquete
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
              <ArrowDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("quantityChange", {
        id: "quantityChangeKg",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Movimiento (kg)
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
              <ArrowDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: (info) => {
          const movementKg = convertFromCanonical(info.getValue(), "kg");
          const prefix = movementKg > 0 ? "+" : "";
          const isPositive = movementKg > 0;
          const isNegative = movementKg < 0;
          return (
            <div className="text-right">
              <span
                className={cn(
                  "inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium",
                  isPositive && "border-emerald-200 bg-emerald-50 text-emerald-700",
                  isNegative && "border-red-200 bg-red-50 text-red-700",
                  !isPositive &&
                    !isNegative &&
                    "border-gray-200 bg-gray-50 text-gray-700",
                )}
              >
                {`${prefix}${formatNumber(movementKg)}`}
              </span>
            </div>
          );
        },
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: data ?? [],
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const normalizedFilterValue = String(filterValue)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      const cols = table.getAllLeafColumns();
      for (const column of cols) {
        const cellValue = row.getValue(column.id);
        if (!cellValue) continue;
        const normalizedCellValue = String(cellValue)
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        if (normalizedCellValue.includes(normalizedFilterValue)) {
          return true;
        }
      }

      return false;
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (data === undefined) {
    return (
      <div className="w-full mt-8 p-6 flex justify-center items-center border rounded-lg shadow-sm">
        <LoadingSpinner />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full mt-8 p-6 flex justify-center items-center border rounded-lg shadow-sm">
        <p className="text-sm text-gray-500">
          No hay movimientos registrados para mostrar.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 flow-root">
      <div className="flex items-center justify-between mb-4">
        <Input
          placeholder="Buscar por etapa, producto, tiquete o referencia..."
          value={globalFilter}
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
