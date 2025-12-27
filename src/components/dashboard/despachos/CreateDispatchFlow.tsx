"use client";
import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import { UnitAwareInput } from "@/components/ui/UnitAwareInput";
import { WeightUnit, convertFromCanonical } from "@/lib/units";

// ------------------- Main Component -------------------
export default function CreateDispatchFlow() {
  const [isCreating, setIsCreating] = useState(false);
  return (
    <div>
      <button
        className={cn(
          "flex gap-2 text-xs justify-center items-center border-[#EBE9E9] shadow p-2 rounded border hover:shadow-lg transition-all cursor-pointer w-48",
          isCreating && "border-primary"
        )}
        onClick={() => setIsCreating(!isCreating)}
      >
        <span
          className={cn(
            "flex size-5 text-black border border-black rounded-full justify-center items-center transition-all",
            isCreating && "border-primary"
          )}
        >
          <PlusIcon className={cn("size-3 transition-all", isCreating && "text-primary")} />
        </span>
        Crear Despacho
      </button>

      {isCreating && <DispatchForm />}
    </div>
  );
}

// ------------------- Form Component -------------------
const formSchema = z.object({
  productId: z.string().min(1, "Debe seleccionar un producto."),
  lotId: z.string().min(1, "Debe seleccionar un lote."),
  quantityDispatched: z.number().positive("La cantidad debe ser mayor que cero."),
  customerId: z.string().optional(),
});
type DispatchFormValues = z.infer<typeof formSchema>;

function DispatchForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const organization = useQuery(api.organizations.getOrg);
  const orgId = organization?._id;

  const finishedGoods = useQuery(api.products.getProductsByType, orgId ? { organizationId: orgId, type: "Finished Good" } : "skip");
  const customers = useQuery(api.customers.getCustomers, orgId ? { organizationId: orgId } : "skip");
  
  const createDispatch = useMutation(api.dispatches.createDispatch);

  const form = useForm<DispatchFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { productId: "", lotId: "", quantityDispatched: 0 },
  });

  const selectedProductId = useWatch({ control: form.control, name: "productId" });
  const availableLots = useQuery(api.inventory.getLotsForProduct, selectedProductId && orgId ? { productId: selectedProductId as Id<"products">, organizationId: orgId } : "skip");

  const selectedLotId = useWatch({ control: form.control, name: "lotId" });
  const selectedLot = availableLots?.find(lot => lot._id === selectedLotId);

  const onSubmit = async (data: DispatchFormValues) => {
    if (!selectedLot || data.quantityDispatched > selectedLot.quantity) {
        form.setError("quantityDispatched", { type: "manual", message: `La cantidad no puede ser mayor que la disponible en el lote (${selectedLot?.quantity}).` });
        return;
    }
    setIsSubmitting(true);
    try {
        await createDispatch({
            organizationId: orgId!,
            customerId: data.customerId as Id<"customers"> | undefined,
            dispatchDate: Date.now(),
            items: [{
                inventoryLotId: data.lotId as Id<"inventoryLots">,
                quantityDispatched: data.quantityDispatched,
            }]
        });
        toast.success("Despacho creado y descontado de inventario.");
        form.reset();
    } catch (error) {
        console.error("Dispatch creation failed:", error);
        toast.error("Error al crear el despacho.");
    } finally {
        setIsSubmitting(false);
    }
  };

  if (!finishedGoods || !customers) return <div className="p-7 mt-3 flex justify-center"><LoadingSpinner /></div>

  return (
    <div className="w-full border border-primary rounded-lg p-7 mt-3">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField name="productId" render={({ field }) => (
                <FormItem>
                    <FormLabel>Producto a Despachar <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un producto..." /></SelectTrigger></FormControl>
                        <SelectContent>{finishedGoods.map(p => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}</SelectContent>
                    </Select>
                </FormItem>
            )}/>
            {selectedProductId && (
                <FormField name="lotId" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Lote Disponible <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder={!availableLots ? "Cargando lotes..." : "Seleccione un lote..."} /></SelectTrigger></FormControl>
                            <SelectContent>{availableLots?.map(lot => (
                              <SelectItem key={lot._id} value={lot._id}>
                                {`${lot.lotNumber} (Disponible: ${parseFloat(convertFromCanonical(lot.quantity, lot.unit as WeightUnit).toPrecision(10))} ${lot.unit})`}
                              </SelectItem>
                            ))}</SelectContent>
                        </Select>
                    </FormItem>
                )}/>
            )}
          </div>
          {selectedLot && (
            <div className="space-y-6 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="quantityDispatched"
                  render={({ field }) => (
                    <FormItem>
                        <FormLabel>Cantidad a Despachar <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <UnitAwareInput
                            valueInCanonicalUnit={field.value}
                            onChange={field.onChange}
                            preferredDisplayUnit={selectedLot?.unit as WeightUnit}
                          />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
                <FormField name="customerId" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Cliente (Opcional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un cliente..." /></SelectTrigger></FormControl>
                            <SelectContent>{customers.map(c => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </FormItem>
                )}/>
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
                {isSubmitting ? <LoadingSpinner /> : "Crear Despacho"}
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}
