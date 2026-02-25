"use client";

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
import { Id } from "../../../../convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
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

type PurchaseHistoryRow = {
  _id: Id<"inventoryLots">;
  purchaseId: Id<"purchases">;
  productId: Id<"products">;
  warehouseId: Id<"warehouse">;
  supplierId?: Id<"suppliers">;
  lotNumber: string;
  productName: string;
  supplierName: string;
  creationDate: number;
  warehouseName: string;
  quantity: number;
  unit: string;
  presentation?: string;
  equivalence?: string;
  averageWeight?: number;
  vehicleInfo: string;
};

const columnHelper = createColumnHelper<PurchaseHistoryRow>();

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

function getEquivalentQuantity(row: PurchaseHistoryRow) {
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

export default function PurchaseHistoryTable() {
  const organization = useQuery(api.organizations.getOrg);
  const orgId = organization?._id;

  const data = useQuery(
    api.purchases.getPurchaseHistory,
    orgId ? { organizationId: orgId } : "skip",
  );
  const warehouses = useQuery(api.warehouse.getAvailableWarehouse);
  const suppliers = useQuery(
    api.suppliers.getSuppliers,
    orgId ? { organizationId: orgId } : "skip",
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
      columnHelper.accessor("creationDate", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Fecha Ingreso
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
              <ArrowDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: (info) => new Date(info.getValue()).toLocaleDateString(),
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
      columnHelper.accessor("vehicleInfo", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Placa Vehiculo
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
        id: "weight",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Peso (kg)
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
          <EditPurchaseEntryDialog
            entry={row.original}
            warehouses={warehouses ?? []}
            suppliers={suppliers ?? []}
          />
        ),
      }),
    ],
    [suppliers, warehouses],
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

  if (data === undefined || warehouses === undefined || suppliers === undefined) {
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
            Historial de Compras
          </h2>
        </div>
        <div className="w-full mt-8 p-6 flex justify-center items-center border rounded-lg shadow-sm">
          <p className="text-sm text-gray-500">
            No hay historial de compras para mostrar.
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
        <ExportActions
          organizationId={orgId}
          moduleName="historial_compras"
          fileBaseName="historial-compras"
          rows={data}
          columns={[
            { header: "No. Tiquete", value: (row) => row.lotNumber },
            { header: "Producto", value: (row) => row.productName },
            { header: "Proveedor", value: (row) => row.supplierName },
            {
              header: "Fecha Ingreso",
              value: (row) => new Date(row.creationDate).toLocaleDateString(),
            },
            { header: "Bodega", value: (row) => row.warehouseName },
            { header: "Placa Vehículo", value: (row) => row.vehicleInfo },
            {
              header: "Cantidad (kg)",
              value: (row) => formatNumber(convertFromCanonical(row.quantity, "kg")),
            },
            {
              header: "Equivalencia",
              value: (row) => {
                const eq = getEquivalentQuantity(row);
                if (eq === null) return "N/A";
                const label = getPresentationLabel(row.presentation, eq);
                return label ? `${formatNumber(eq)} ${label}` : "N/A";
              },
            },
          ]}
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

function EditPurchaseEntryDialog({
  entry,
  warehouses,
  suppliers,
}: {
  entry: PurchaseHistoryRow;
  warehouses: Array<{ _id: Id<"warehouse">; name: string }>;
  suppliers: Array<{ _id: Id<"suppliers">; name: string }>;
}) {
  const editPurchaseEntry = useMutation(api.purchases.editPurchaseEntry);

  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lotNumber, setLotNumber] = useState(entry.lotNumber);
  const [vehicleInfo, setVehicleInfo] = useState(entry.vehicleInfo);
  const [warehouseId, setWarehouseId] = useState<string>(entry.warehouseId);
  const [supplierId, setSupplierId] = useState<string>(entry.supplierId ?? "none");
  const [quantityKg, setQuantityKg] = useState<string>(
    String(convertFromCanonical(entry.quantity, "kg")),
  );

  const handleSave = async () => {
    const parsedQuantity = Number(quantityKg);
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      toast.error("La cantidad debe ser mayor que cero.");
      return;
    }

    try {
      setIsSaving(true);
      await editPurchaseEntry({
        inventoryLotId: entry._id,
        lotNumber,
        vehicleInfo,
        warehouseId: warehouseId as Id<"warehouse">,
        supplierId:
          supplierId === "none"
            ? undefined
            : (supplierId as Id<"suppliers">),
        quantity: convertToCanonical(parsedQuantity, "kg"),
      });
      toast.success("Compra actualizada correctamente.");
      setOpen(false);
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo actualizar la compra.");
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
          <DialogTitle>Editar Compra</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm mb-2">No. Tiquete</p>
            <Input value={lotNumber} onChange={(e) => setLotNumber(e.target.value)} />
          </div>
          <div>
            <p className="text-sm mb-2">Placa Vehiculo</p>
            <Input
              value={vehicleInfo}
              onChange={(e) => setVehicleInfo(e.target.value)}
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
            <p className="text-sm mb-2">Bodega</p>
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
          <div className="md:col-span-2">
            <p className="text-sm mb-2">Proveedor</p>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione proveedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin proveedor</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier._id} value={supplier._id}>
                    {supplier.name}
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
