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
import { useMemo, useState } from "react";
import { LoadingSpinner } from "@/assets/icons/LoadingSpinner";
import { convertFromCanonical, WeightUnit } from "@/lib/units";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PaginationControls } from "../bodega/PaginationControls";
import { formatNumber } from "@/lib/utils";

// Define the type for our flattened dispatch history data
type DispatchHistoryRow = {
  _id: Id<"dispatchLineItems">;
  dispatchDate: number;
  customerName: string;
  lotNumber: string;
  productName: string;
  quantityDispatched: number;
  unit: string;
};

const columnHelper = createColumnHelper<DispatchHistoryRow>();

export default function DispatchHistoryTable() {
  const organization = useQuery(api.organizations.getOrg);
  const orgId = organization?._id;

  const data = useQuery(
    api.dispatches.getDispatchHistory,
    orgId ? { organizationId: orgId } : "skip",
  );
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("dispatchDate", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Fecha Despacho
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
              <ArrowDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: (info) => new Date(info.getValue()).toLocaleDateString(),
      }),
      columnHelper.accessor("customerName", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Cliente
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
            No. Lote
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
              <ArrowDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: (info) => info.getValue(),
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
      columnHelper.accessor("quantityDispatched", {
        id: "quantity",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Cantidad (kg)
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
          const displayValue = formatNumber(
            convertFromCanonical(quantity, "kg"),
          );

          return `${displayValue}`;
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

  if (data.length === 0) {
    return (
      <div className="mt-8 flow-root">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold leading-7 text-gray-900 sm:truncate sm:text-2xl sm:tracking-tight">
            Historial de Despachos
          </h2>
        </div>
        <div className="w-full mt-8 p-6 flex justify-center items-center border rounded-lg shadow-sm">
          <p className="text-sm text-gray-500">
            No hay historial de despachos para mostrar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 flow-root">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold leading-7 text-gray-900 sm:truncate sm:text-2xl sm:tracking-tight">
          Historial de Despachos
        </h2>
        <div className="w-full md:w-1/3">
          <Input
            placeholder="Buscar por item, proveedor o tiquete..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
        </div>
      </div>
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <PaginationControls table={table} />
          </div>
        </div>
      </div>
    </div>
  );
}
