"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

import { cn, formatNumber } from "@/lib/utils";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/assets/icons/LoadingSpinner";
import { convertFromCanonical, convertToCanonical } from "@/lib/units";

const PrerequisitesMissing = ({ missing }: { missing: string[] }) => {
  const itemToPath: Record<string, string> = {
    "materias primas": "/dashboard/creacion-productos",
    bodegas: "/dashboard/creacion-bodegas",
    proveedores: "/dashboard/creacion-proveedores",
  };
  return (
    <div className="w-full border border-yellow-400 bg-yellow-50 rounded-lg p-7 mt-3 text-center">
      <h3 className="font-semibold text-yellow-800">
        Faltan Requisitos para Continuar
      </h3>
      <p className="mt-2 text-sm text-yellow-700">
        Para registrar una compra, primero debe crear: {missing.join(", ")}.
      </p>
      <div className="flex gap-4 justify-center mt-4">
        {missing.map((item) => (
          <Link key={item} href={itemToPath[item]}>
            <Button variant="outline" size="sm">
              Ir a Crear {item}
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default function PurchaseFlow() {
  const [isCreating, setIsCreating] = useState(false);

  const organization = useQuery(api.organizations.getOrg);
  const orgId = organization?._id;

  const rawMaterials = useQuery(
    api.products.getProductsByType,
    orgId ? { organizationId: orgId, type: "Raw Material" } : "skip",
  );
  const warehouses = useQuery(api.warehouse.getAvailableWarehouse);

  const suppliers = useQuery(
    api.suppliers.getSuppliers,
    orgId ? { organizationId: orgId } : "skip",
  );

  const isLoadingPrerequisites =
    !organization || !rawMaterials || !warehouses || !suppliers;

  const missingPrerequisites = [];
  if (rawMaterials?.length === 0) missingPrerequisites.push("materias primas");
  if (warehouses?.length === 0) missingPrerequisites.push("bodegas");
  if (suppliers?.length === 0) missingPrerequisites.push("proveedores");

  const toggleCreation = () => {
    if (isCreating) {
      setIsCreating(false);
    } else {
      if (missingPrerequisites.length > 0 && !isLoadingPrerequisites) {
        setIsCreating(true);
      } else if (!isLoadingPrerequisites) {
        setIsCreating(true);
      }
    }
  };

  return (
    <div>
      <button
        className={cn(
          "flex gap-2 text-xs justify-center items-center border-[#EBE9E9] shadow p-2 rounded border hover:shadow-lg transition-all cursor-pointer w-48",
          isCreating && "border-primary",
        )}
        onClick={toggleCreation}
        disabled={isLoadingPrerequisites}
      >
        <span
          className={cn(
            "flex size-5 text-black border border-black rounded-full justify-center items-center transition-all",
            isCreating && "border-primary",
          )}
        >
          {isLoadingPrerequisites ? (
            <LoadingSpinner className="size-3 text-black" />
          ) : (
            <PlusIcon
              className={cn(
                "size-3 transition-all",
                isCreating && "text-primary",
              )}
            />
          )}
        </span>
        Agregar Compra
      </button>

      {isCreating && (
        <>
          {missingPrerequisites.length > 0 ? (
            <PrerequisitesMissing missing={missingPrerequisites} />
          ) : (
            <PurchaseForm
              rawMaterials={rawMaterials!}
              warehouses={warehouses!}
              suppliers={suppliers!}
              orgId={orgId as Id<"organizations">}
            />
          )}
        </>
      )}
    </div>
  );
}

const formSchema = z.object({
  productId: z.string().min(1, "Debe seleccionar un producto."),
  quantity: z.number().positive("La cantidad debe ser mayor que cero."),
  lotNumber: z.string().min(1, "El número de lote es obligatorio."),
  warehouseId: z.string().min(1, "Debe seleccionar una bodega."),
  supplierId: z.string().min(1, "Debe seleccionar un proveedor."),
  qualityFactors: z.record(z.string(), z.string()).optional(), // Made optional for now
  vehicleInfo: z.string().min(1, "Minimo 1 caracter"),
});

type PurchaseFormValues = z.infer<typeof formSchema>;

function PurchaseForm({
  rawMaterials,
  warehouses,
  suppliers,
  orgId,
}: {
  rawMaterials: any[];
  warehouses: any[];
  suppliers: any[];
  orgId: Id<"organizations">;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createPurchase = useMutation(api.purchases.createPurchase);
  const receivePurchase = useMutation(api.purchases.receivePurchase);

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productId: "",
      quantity: 0,
      lotNumber: ``,
      warehouseId: "",
      supplierId: "",
      qualityFactors: {},
      vehicleInfo: "",
    },
  });

  const selectedProductId = useWatch({
    control: form.control,
    name: "productId",
  });

  const qualityFactorsQuery = useQuery(
    api.products.getQualityFactorsForProduct,
    selectedProductId
      ? { productId: selectedProductId as Id<"products"> }
      : "skip",
  );

  const selectedProductInfo = useMemo(() => {
    return rawMaterials.find((e) => e._id == selectedProductId);
  }, [selectedProductId, rawMaterials]);

  const onSubmit = async (data: PurchaseFormValues) => {
    setIsSubmitting(true);
    try {
      const selectedWarehouse = warehouses.find(
        (w) => w._id === data.warehouseId,
      );
      if (!selectedWarehouse) {
        toast.error("Bodega no encontrada.");
        setIsSubmitting(false);
        return;
      }
      const purchaseWeightInGrams = convertToCanonical(data.quantity, "kg");
      if (purchaseWeightInGrams > selectedWarehouse.capacityLeftInGrams) {
        toast.error(
          `No hay suficiente espacio en la bodega. Espacio disponible: ${formatNumber(
            convertFromCanonical(selectedWarehouse.capacityLeftInGrams, "kg"),
          )} kg.`,
        );
        setIsSubmitting(false);
        return;
      }
      const purchaseId = await createPurchase({
        organizationId: orgId,
        supplierId: data.supplierId as Id<"suppliers">,
        orderDate: Date.now(),
      });

      await receivePurchase({
        purchaseId,
        productId: data.productId as Id<"products">,
        warehouseId: data.warehouseId as Id<"warehouse">,
        lotNumber: data.lotNumber,
        quantity: purchaseWeightInGrams,
        qualityFactorValues: data.qualityFactors,
        vehicleInfo: data.vehicleInfo,
      });

      toast.success("Compra registrada y recibida en inventario.");
      form.reset();
    } catch (e: any) {
      if (e.message?.includes("already exists")) {
        toast.error(
          `El número de tiquete '${data.lotNumber}' ya existe. Por favor, ingrese un número de tiquete diferente.`,
        );
      } else {
        toast.error("Error al registrar la compra.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full border border-primary rounded-lg p-7 mt-3">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* --- Step 1: Select Product --- */}
          <FormField
            control={form.control}
            name="productId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Materia Prima a Ingresar{" "}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="min-w-40">
                      <SelectValue placeholder="Seleccione un producto..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {rawMaterials.map((p) => (
                      <SelectItem key={p._id} value={p._id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          {selectedProductId && (
            <div className="space-y-6 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FormField
                  name="lotNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Número de Tiquete{" "}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder={`# tiquete`} {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Cantidad Recibida (kg){" "}
                        <span className="text-destructive">*</span>

                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          inputMode="decimal"
                          {...form.register("quantity", {
                            valueAsNumber: true,
                          })}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  name="vehicleInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Placa del vehiculo{" "}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Placa" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  name="warehouseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Almacenar en Bodega{" "}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione bodega..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {warehouses.map((w) => (
                            <SelectItem key={w._id} value={w._id}>
                              {`${w.name} (Disponible: ${formatNumber(
                                convertFromCanonical(
                                  w.capacityLeftInGrams,
                                  "kg",
                                ),
                              )}kg)`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Proveedor <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione proveedor..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {suppliers.map((s) => (
                            <SelectItem key={s._id} value={s._id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              {/* --- Quality Factors --- */}
              {qualityFactorsQuery && qualityFactorsQuery.length > 0 && (
                <div className="pt-4 border-t">
                  <h3 className="text-md font-semibold mb-2">
                    Factores de Calidad
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {qualityFactorsQuery.map((qf: any) => (
                      <FormField
                        key={qf!._id}
                        name={`qualityFactors.${qf!._id}`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">
                              {qf!.name}
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder={qf!.unit ?? "Valor"}
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </div>
              )}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full md:w-auto"
              >
                {isSubmitting ? <LoadingSpinner /> : "Registrar Compra"}
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}
