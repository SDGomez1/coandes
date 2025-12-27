"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { XIcon } from "lucide-react";
import { useState } from "react";
import { CancelConfirmation } from "./CancelConfirm";
import z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../../../convex/_generated/dataModel";
import { convertToCanonical, WEIGHT_UNIT_OPTIONS } from "@/lib/units";

const formSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").trim(),
  capacity: z
    .number()
    .finite("Capacidad inválida")
    .nonnegative("Debe ser 0 o mayor"),
  unit: z.enum(["g", "kg", "lb", "oz", "ton"]),
  rows: z
    .number()
    .int("Debe ser un número entero")
    .positive("Debe ser mayor que 0"),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateNewWarehouse() {
  const orgId = useQuery(api.organizations.getOrg);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const createWarehouse = useMutation(api.warehouse.createWarehouse);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      capacity: 0,
      unit: "kg",
      rows: 1,
    },
    mode: "onSubmit",
  });

  const currentUnit = form.watch("unit");
  const currentCapacity = form.watch("capacity");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="flex gap-2 text-xs justify-center items-center border-[#EBE9E9] shadow p-2 rounded border hover:shadow-lg transition-all cursor-pointer my-6"
        onClick={() => setOpen(true)}
      >
        <span className="flex size-5 text-black border border-black rounded-full justify-center items-center">
          <XIcon className="rotate-45 size-3" />
        </span>
        Agregar Bodega
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className="p-0 border-none ring-none h-[60vh] flex flex-col"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="bg-primary w-full h-12 rounded-t-lg" />
        {cancelConfirm ? (
          <CancelConfirmation
            onBack={() => setCancelConfirm(false)}
            onConfirm={() => {
              setCancelConfirm(false);
              form.reset();
              setOpen(false);
            }}
          />
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(
                async (data) => {
                  try {
                    setIsLoading(true);
                    await createWarehouse({
                      organizationId: orgId?._id as Id<"organizations">,
                      name: data.name,
                      row: data.rows,
                      capacity: convertToCanonical(data.capacity, data.unit),
                      baseUnit: data.unit,
                    });
                    toast.success("Bodega creada correctamente");
                    form.reset();
                    setOpen(false);
                  } catch (e) {
                    toast.error(
                      "Tenemos problemas para crear una nueva bodega, inténtalo más tarde",
                    );
                  } finally {
                    setIsLoading(false);
                  }
                },
                (e) => console.log(e),
              )}
              className="px-9 flex flex-col h-full overflow-y-auto"
            >
              <DialogTitle className="mt-7 font-semibold text-lg">
                Información básica
              </DialogTitle>
              <p className="text-gray-ligth mt-4 mb-6">
                Defina las características de la bodega
              </p>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-normal">
                        Nombre de la bodega{" "}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Villavicencio"
                          className="text-xs placeholder:text-xs"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-normal">
                        Unidad base <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full shrink">
                            <SelectValue placeholder="kilogramo/kg" />
                          </SelectTrigger>
                          <SelectContent>
                            {WEIGHT_UNIT_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-normal">
                        Capacidad máxima{" "}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="2000"
                          className="text-xs placeholder:text-xs"
                          {...form.register("capacity", {
                            valueAsNumber: true,
                          })}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rows"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-normal">
                        Número de filas{" "}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="numeric"
                          placeholder="10"
                          className="text-xs placeholder:text-xs"
                          {...form.register("rows", {
                            valueAsNumber: true,
                          })}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex w-full justify-center items-center my-4">
                <p className="text-sm text-gray-ligth">
                  Capacidad máxima:{" "}
                  {typeof currentCapacity === "number" && currentCapacity > 0
                    ? currentCapacity
                    : 100}{" "}
                  {currentUnit?.trim() ? currentUnit : "kg"}
                </p>
              </div>

              <div className="flex justify-between mt-auto gap-4 pt-4 pb-11">
                <Button
                  type="button"
                  className="w-1/2 shrink"
                  variant="outline"
                  onClick={() => setCancelConfirm(true)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  className="bg-primary px-4 py-2 rounded text-white w-1/2 shrink"
                  disabled={isLoading}
                >
                  {isLoading ? "Guardando..." : "Terminar"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
