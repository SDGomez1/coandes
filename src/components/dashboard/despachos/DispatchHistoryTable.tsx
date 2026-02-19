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
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { LoadingSpinner } from "@/assets/icons/LoadingSpinner";
import { convertFromCanonical, convertToCanonical } from "@/lib/units";
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

type DispatchHistoryRow = {
  _id: Id<"dispatchLineItems">;
  dispatchId: Id<"dispatches">;
  inventoryLotId: Id<"inventoryLots">;
  customerId?: Id<"customers">;
  dispatchDate: number;
  customerName: string;
  lotNumber: string;
  lotNumberDispatch: string;
  productName: string;
  quantityDispatched: number;
  unit: string;
  presentation?: string;
  equivalence?: string;
  averageWeight?: number;
};

const columnHelper = createColumnHelper<DispatchHistoryRow>();

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

function getEquivalentQuantity(row: DispatchHistoryRow) {
  const averageWeight = row.averageWeight ?? 0;
  if (averageWeight <= 0) {
    return null;
  }
  const presentationLabel = (row.presentation ?? "").trim();
  if (!presentationLabel) {
    return null;
  }

  const equivalence = parsePositiveNumber(row.equivalence) ?? 1;
  return (row.quantityDispatched * equivalence) / averageWeight;
}

export default function DispatchHistoryTable() {
  const organization = useQuery(api.organizations.getOrg);
  const orgId = organization?._id;

  const data = useQuery(
    api.dispatches.getDispatchHistory,
    orgId ? { organizationId: orgId } : "skip",
  );
  const customers = useQuery(
    api.customers.getCustomers,
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
      columnHelper.accessor("lotNumberDispatch", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            No. tiquete despacho
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

          return <p className="w-full text-right tabular-nums">{displayValue}</p>;
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
      columnHelper.display({
        id: "actions",
        header: "Acciones",
        cell: ({ row }) => (
          <EditDispatchEntryDialog
            entry={row.original}
            customers={customers ?? []}
          />
        ),
      }),
    ],
    [customers],
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
      const normalizedFilterValue = filterValue
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      const cols = table.getAllLeafColumns();
      const searchInRow = (tableRow: any) => {
        for (const column of cols) {
          const cellValue = tableRow.getValue(column.id);
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

  if (data === undefined || customers === undefined) {
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

function EditDispatchEntryDialog({
  entry,
  customers,
}: {
  entry: DispatchHistoryRow;
  customers: Array<{ _id: Id<"customers">; name: string }>;
}) {
  const editDispatchEntry = useMutation(api.dispatches.editDispatchEntry);

  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [ticketNumber, setTicketNumber] = useState(entry.lotNumberDispatch);
  const [quantityKg, setQuantityKg] = useState<string>(
    String(convertFromCanonical(entry.quantityDispatched, "kg")),
  );
  const [customerId, setCustomerId] = useState<string>(entry.customerId ?? "none");
  const [dispatchDate, setDispatchDate] = useState(
    new Date(entry.dispatchDate).toISOString().slice(0, 10),
  );

  const handleSave = async () => {
    const parsedQuantity = Number(quantityKg);
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      toast.error("La cantidad debe ser mayor que cero.");
      return;
    }

    const parsedDate = new Date(dispatchDate);
    if (Number.isNaN(parsedDate.getTime())) {
      toast.error("La fecha de despacho es inválida.");
      return;
    }

    try {
      setIsSaving(true);
      await editDispatchEntry({
        dispatchLineItemId: entry._id,
        ticketNumber,
        quantityDispatched: convertToCanonical(parsedQuantity, "kg"),
        customerId:
          customerId === "none" ? undefined : (customerId as Id<"customers">),
        dispatchDate: parsedDate.getTime(),
      });
      toast.success("Despacho actualizado correctamente.");
      setOpen(false);
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo actualizar el despacho.");
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
          <DialogTitle>Editar Despacho</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm mb-2">No. Tiquete despacho</p>
            <Input
              value={ticketNumber}
              onChange={(e) => setTicketNumber(e.target.value)}
            />
          </div>
          <div>
            <p className="text-sm mb-2">Cantidad (kg)</p>
            <Input
              type="number"
              inputMode="decimal"
              step="any"
              value={quantityKg}
              onChange={(e) => setQuantityKg(e.target.value)}
            />
          </div>
          <div>
            <p className="text-sm mb-2">Fecha</p>
            <Input
              type="date"
              value={dispatchDate}
              onChange={(e) => setDispatchDate(e.target.value)}
            />
          </div>
          <div>
            <p className="text-sm mb-2">Cliente</p>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin cliente</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer._id} value={customer._id}>
                    {customer.name}
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
