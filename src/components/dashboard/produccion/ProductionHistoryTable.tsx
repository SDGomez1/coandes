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

// Define the type for our flattened history data
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
    }[];
};

const columnHelper = createColumnHelper<ProductionHistoryRow>();

export default function ProductionHistoryTable() {
  const organization = useQuery(api.organizations.getOrg);
  const orgId = organization?._id;

  const data = useQuery(
    api.production.getProductionHistory,
    orgId ? { organizationId: orgId } : "skip"
  );

  const columns = useMemo(() => [
    columnHelper.accessor("runDate", {
      header: () => <span>Fecha</span>,
      cell: (info) => new Date(info.getValue()).toLocaleDateString(),
    }),
    columnHelper.accessor(row => `${row.inputProductName} (Lote: ${row.inputLotNumber})`, {
      id: "inputProduct",
      header: () => <span>Entrada</span>,
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor(row => `${row.quantityConsumed} ${row.inputUnit}`, {
        id: "quantityConsumed",
        header: () => <span>Cant. Consumida</span>,
        cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("outputs", {
      header: () => <span>Salidas</span>,
      cell: (info) => (
        <ul className="list-disc pl-4 space-y-1">
            {info.getValue().map((output, index) => (
                <li key={index} className="text-xs">
                    <span className="font-semibold">{output.productName}:</span> {output.quantityProduced} {output.unit}
                    <span className="text-gray-500"> (Lote: {output.newLotNumber})</span>
                </li>
            ))}
        </ul>
      ),
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
            <p className="text-sm text-gray-500">No hay historial de producción para mostrar.</p>
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
                        className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 align-top"
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
