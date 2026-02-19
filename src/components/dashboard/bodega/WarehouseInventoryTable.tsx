"use client";

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
import { useMemo, useState } from "react";
import { LoadingSpinner } from "@/assets/icons/LoadingSpinner";
import { convertFromCanonical, WeightUnit } from "@/lib/units";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PaginationControls } from "./PaginationControls";

type WarehouseInventoryRow = {
  _id: Id<"inventoryLots">;
  lotNumber: string;
  productName: string;
  productType: string;
  supplierName: string;
  quantity: number;
  presentation?: string;
  equivalence?: string;
  averageWeight?: number;
};

const columnHelper = createColumnHelper<WarehouseInventoryRow>();

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function parsePositiveNumber(value: string | number | undefined) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function getPresentationLabel(
  presentation: string | undefined,
  quantity: number,
) {
  const normalizedLabel = (presentation ?? "").trim();
  if (!normalizedLabel) return "";
  if (quantity === 1 || normalizedLabel.toLowerCase().endsWith("s")) {
    return normalizedLabel;
  }
  return `${normalizedLabel}s`;
}

function getEquivalentQuantity(row: WarehouseInventoryRow) {
  const averageWeight = row.averageWeight ?? 0;
  if (averageWeight <= 0) {
    return null;
  }
  const presentationLabel = (row.presentation ?? "").trim();
  if (!presentationLabel) {
    return null;
  }

  const equivalence = parsePositiveNumber(row.equivalence) ?? 1;
  return (row.quantity * equivalence) / averageWeight;
}

export default function WarehouseInventoryTable({
  warehouseId,
  organizationId,
}: {
  warehouseId: Id<"warehouse">;
  organizationId: Id<"organizations">;
}) {
  const warehouses = useQuery(api.warehouse.getAvailableWarehouse, {});
  const selectedWarehouse = warehouses?.find((w) => w._id === warehouseId);

  const data = useQuery(
    api.inventory.getWarehouseInventory,
    warehouseId && organizationId ? { warehouseId, organizationId } : "skip",
  );
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("lotNumber", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            No. Tiquete
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
              <ArrowDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor(
        (row) => `${row.productName} / ${row.supplierName}`,
        {
          id: "itemSupplier",
          header: ({ column }) => (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Item/Proveedor
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : (
                <ArrowDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          ),
          cell: (info) => <em>{info.getValue()}</em>,
        },
      ),
      columnHelper.accessor("productType", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Tipo de Producto
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
              <ArrowDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("quantity", {
        id: "currentWeight",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Peso (Unidad original)
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
              <ArrowDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: (info) => {
          const quantity = info.getValue();
          if (quantity === null || quantity === undefined) return "N/A";
          const displayValue = convertFromCanonical(
            quantity,
            selectedWarehouse?.baseUnit as WeightUnit,
          );
          return (
            <p className="w-full text-right tabular-nums">{`${formatNumber(displayValue)} ${selectedWarehouse?.baseUnit}`}</p>
          );
        },
      }),
      columnHelper.accessor("quantity", {
        id: "weightInKg",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Peso (KG)
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
              <ArrowDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: (info) => {
          const quantity = info.getValue();
          if (quantity === null || quantity === undefined) return "N/A";
          const displayValue = convertFromCanonical(
            quantity,
            "kg" as WeightUnit,
          );
          return (
            <p className="w-full text-right tabular-nums">{`${formatNumber(displayValue)} `}</p>
          );
        },
      }),
      columnHelper.accessor((row) => getEquivalentQuantity(row), {
        id: "equivalenceUnitQuantity",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Equivalencia
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
              <ArrowDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: (info) => {
          const equivalenceQuantity = info.getValue();
          if (equivalenceQuantity === null || equivalenceQuantity === undefined) {
            return "N/A";
          }
          const label = getPresentationLabel(
            info.row.original.presentation,
            equivalenceQuantity,
          );
          if (!label) return "N/A";
          return (
            <p className="w-full text-right tabular-nums">
              {`${formatNumber(equivalenceQuantity)} ${label}`}
            </p>
          );
        },
      }),
      /*     columnHelper.display({
        id: "actions",
        header: () => <span>Acciones</span>,
        cell: (info) => (
          <Button
            onClick={() =>
              router.push(`/dashboard/bodega/lote/${info.row.original._id}`)
            }
          >
            Ver
          </Button>
        ),
      }),*/
    ],
    [selectedWarehouse?.baseUnit],
  );

  const table = useReactTable({
    data: data?.items ?? [],
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      const normalizedFilterValue = filterValue
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      const columns = table.getAllLeafColumns();
      const searchInRow = (row: any) => {
        for (const column of columns) {
          const cellValue = row.getValue(column.id);
          if (cellValue) {
            const normalizedCellValue = String(cellValue)
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "");
            if (normalizedCellValue.includes(normalizedFilterValue)) {
              return true;
            }
          }
        }
        return false;
      };

      return searchInRow(row);
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

  if (data.items.length === 0) {
    return (
      <div className="mt-8 flow-root">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold leading-7 text-gray-900 sm:truncate sm:text-2xl sm:tracking-tight">
            {`Inventario de la bodega`}
          </h2>
        </div>
        <div className="w-full mt-8 p-6 flex justify-center items-center border rounded-lg shadow-sm">
          <p className="text-sm text-gray-500">
            No hay inventario en esta bodega.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 flow-root">
      <div className="flex items-center justify-between mb-4">
        <Input
          placeholder="Buscar por item, proveedor o tiquete..."
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
