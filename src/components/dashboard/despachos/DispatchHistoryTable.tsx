"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo } from "react";
import { LoadingSpinner } from "@/assets/icons/LoadingSpinner";

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
    orgId ? { organizationId: orgId } : "skip"
  );

  const columns = useMemo(() => [
    columnHelper.accessor("dispatchDate", {
      header: () => <span>Fecha Despacho</span>,
      cell: (info) => new Date(info.getValue()).toLocaleDateString(),
    }),
    columnHelper.accessor("customerName", {
      header: () => <span>Cliente</span>,
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("lotNumber", {
        header: () => <span>No. Lote</span>,
        cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("productName", {
        header: () => <span>Producto</span>,
        cell: (info) => info.getValue(),
    }),
    columnHelper.accessor((row) => `${row.quantityDispatched} ${row.unit}`, {
      id: "quantity",
      header: () => <span>Cantidad</span>,
      cell: (info) => info.getValue(),
    }),
  ], []);

  const table = useReactTable({
    data: data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
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
            <p className="text-sm text-gray-500">No hay historial de despachos para mostrar.</p>
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
                              header.getContext()
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
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
