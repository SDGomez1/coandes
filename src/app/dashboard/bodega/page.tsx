"use client";
import BreadCrumb from "@/components/dashboard/BreadCrumb";
import SideNav from "@/components/dashboard/sidenav/SideNav";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import WarehouseInventoryTable from "@/components/dashboard/bodega/WarehouseInventoryTable";
import { Id } from "../../../../convex/_generated/dataModel";
import { LoadingSpinner } from "@/assets/icons/LoadingSpinner";
import Link from "next/link";
import { cn, formatNumber } from "@/lib/utils";
import { convertFromCanonical, convertToCanonical } from "@/lib/units";

export default function Page() {
  const organization = useQuery(api.organizations.getOrg);
  const orgId = organization?._id as Id<"organizations">;

  const warehouses = useQuery(api.warehouse.getAvailableWarehouse, {});
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<
    Id<"warehouse"> | undefined
  >(undefined);

  // Find the selected warehouse object
  const selectedWarehouse = warehouses?.find(
    (w) => w._id === selectedWarehouseId,
  );

  // Fetch inventory data for the selected warehouse
  const warehouseInventoryData = useQuery(
    api.inventory.getWarehouseInventory,
    selectedWarehouseId && orgId
      ? { warehouseId: selectedWarehouseId, organizationId: orgId }
      : "skip",
  );

  const currentAmount = Number(warehouseInventoryData?.totalQuantity) ?? 0;
  const maxCapacity = selectedWarehouse?.capacity ?? 0;
  const unit = selectedWarehouse?.baseUnit ?? "g";
  const percentageUsage =
    maxCapacity > 0 ? (currentAmount / maxCapacity) * 100 : 0;

  if (!organization || !warehouses) {
    return (
      <section className="w-full h-full flex items-center justify-center">
        <LoadingSpinner />
      </section>
    );
  }

  return (
    <>
      <div className="lg:px-8 px-4">
        <BreadCrumb />
        <Separator />
      </div>
      <div className="py-12 lg:px-8 px-4">
        <h2 className="text-lg font-semibold mb-6">Inventario por Bodega</h2>

        <div className="mb-8 space-y-2">
          <Label>
            Seleccionar Bodega <span className="text-destructive">*</span>
          </Label>
          <Select
            onValueChange={(value: Id<"warehouse">) =>
              setSelectedWarehouseId(value)
            }
            value={selectedWarehouseId}
          >
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Seleccione una bodega" />
            </SelectTrigger>
            <SelectContent>
              {warehouses.length === 0 ? (
                <SelectItem value="no-warehouses" disabled>
                  No hay bodegas disponibles
                </SelectItem>
              ) : (
                warehouses.map((warehouse) => (
                  <SelectItem key={warehouse._id} value={warehouse._id}>
                    {warehouse.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {selectedWarehouseId && selectedWarehouse && (
          <div className="mb-8 p-4 border rounded-lg shadow-sm">
            <h3 className="text-md font-semibold mb-2">
              Estado de la Bodega: {selectedWarehouse.name}
            </h3>
            <div className="flex justify-between text-sm text-gray-700">
              <span>
                Actual:{" "}
                <span className="font-semibold">
                  {formatNumber(convertFromCanonical(currentAmount, unit))}{" "}
                  {unit}
                </span>
              </span>
              <span>
                Capacidad:{" "}
                <span className="font-semibold">
                  {formatNumber(convertFromCanonical(maxCapacity, unit))} {unit}
                </span>
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div
                className={cn(
                  "h-2.5 rounded-full",
                  percentageUsage < 70 && "bg-primary",
                  percentageUsage >= 70 &&
                    percentageUsage < 90 &&
                    "bg-orange-400",
                  percentageUsage >= 90 && "bg-red-500",
                )}
                style={{ width: `${Math.min(percentageUsage, 100)}%` }}
              ></div>
            </div>
            <div className="text-right text-sm text-gray-700 mt-1">
              {percentageUsage.toFixed(2)}% de uso
            </div>
          </div>
        )}

        <h3 className="text-lg font-semibold mb-6">Inventario de la bodega</h3>

        {selectedWarehouseId && orgId && (
          <WarehouseInventoryTable
            warehouseId={selectedWarehouseId}
            organizationId={orgId}
          />
        )}

        {!selectedWarehouseId && warehouses.length > 0 && (
          <div className="w-full mt-8 p-6 flex justify-center items-center border rounded-lg shadow-sm">
            <p className="text-sm text-gray-500">
              Por favor, seleccione una bodega para ver su inventario.
            </p>
          </div>
        )}

        {warehouses.length === 0 && (
          <div className="w-full mt-8 p-6 flex justify-center items-center border border-yellow-400 bg-yellow-50 rounded-lg shadow-sm">
            <p className="text-sm text-yellow-800">
              No hay bodegas creadas. Por favor,{" "}
              <Link href="/dashboard/creacion-bodegas" className="underline">
                cree una bodega
              </Link>{" "}
              para gestionar su inventario.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
