"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  Table,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { LoadingSpinner } from "@/assets/icons/LoadingSpinner";
import { convertFromCanonical, WeightUnit } from "@/lib/units";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

// Define the type for our flattened purchase history data
type PurchaseHistoryRow = {
  _id: Id<"inventoryLots">;
  lotNumber: string;
  productName: string;
  supplierName: string;
  creationDate: number;
  warehouseName: string;
  quantity: number;
  unit: string;
  vehicleInfo: string;
};

const columnHelper = createColumnHelper<PurchaseHistoryRow>();

// --- Pagination Controls Component ---
function PaginationControls<T>({ table }: { table: Table<T> }) {
  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();

  const getPageNumbers = () => {
    const pages = [];
    if (pageCount <= 5) {
      for (let i = 0; i < pageCount; i++) pages.push(i);
    } else {
      if (pageIndex < 3) {
        pages.push(0, 1, 2, 3, -1, pageCount - 1);
      } else if (pageIndex >= pageCount - 3) {
        pages.push(
          0,
          -1,
          pageCount - 4,
          pageCount - 3,
          pageCount - 2,
          pageCount - 1,
        );
      } else {
        pages.push(0, -1, pageIndex - 1, pageIndex, pageIndex + 1, -1, pageCount - 1);
      }
    }
    return pages;
  };

  const start = pageIndex * table.getState().pagination.pageSize + 1;
  const end = Math.min(start + table.getState().pagination.pageSize - 1, table.getFilteredRowModel().rows.length);

  return (
    <div className="flex items-center justify-between p-4">
      <span className="text-sm text-gray-700">
        Mostrando {start} a {end} de {table.getFilteredRowModel().rows.length} resultados
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        {getPageNumbers().map((page, i) =>
          page === -1 ? (
            <span key={`ellipsis-${i}`} className="px-2">...</span>
          ) : (
            <Button
              key={page}
              variant={page === pageIndex ? "default" : "outline"}
              size="icon"
              onClick={() => table.setPageIndex(page)}
            >
              {page + 1}
            </Button>
          ),
        )}
        <Button
          variant="outline"
          size="icon"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => table.setPageIndex(pageCount - 1)}
          disabled={!table.getCanNextPage()}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
        <Select
          value={String(table.getState().pagination.pageSize)}
          onValueChange={(value) => {
            table.setPageSize(Number(value));
          }}
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[2, 20, 30, 40, 50].map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size} / página
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}


export default function PurchaseHistoryTable() {
  const organization = useQuery(api.organizations.getOrg);
  const orgId = organization?._id;

  const data = useQuery(
    api.purchases.getPurchaseHistory,
    orgId ? { organizationId: orgId } : "skip",
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("lotNumber", {
        header: () => <span>No. Tiquete</span>,
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor(
        (row) => `${row.productName} / ${row.supplierName}`,
        {
          id: "itemSupplier",
          header: () => <span>Item/Proveedor</span>,
          cell: (info) => <em>{info.getValue()}</em>,
        },
      ),
      columnHelper.accessor("creationDate", {
        header: () => <span>Fecha Ingreso</span>,
        cell: (info) => new Date(info.getValue()).toLocaleDateString(),
      }),
      columnHelper.accessor("warehouseName", {
        header: () => <span>Bodega</span>,
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("vehicleInfo", {
        header: () => <span>Placa Vehiculo</span>,
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("quantity", {
        id: "weight",
        header: () => <span>Peso</span>,
        cell: (info) => {
          const quantity = info.getValue();
          const { unit } = info.row.original;
          if (quantity === null || quantity === undefined) return "N/A";
          const displayValue = parseFloat(
            convertFromCanonical(quantity, unit as WeightUnit).toPrecision(10),
          );
          return `${displayValue} ${unit}`;
        },
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
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
          No hay historial de compras para mostrar.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 flow-root">
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

