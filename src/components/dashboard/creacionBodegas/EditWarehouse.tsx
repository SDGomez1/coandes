"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SquarePen } from "lucide-react";
import { useEffect, useState } from "react";
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
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../../../convex/_generated/dataModel";
import {
  convertFromCanonical,
  convertToCanonical,
  WEIGHT_UNIT_OPTIONS,
} from "@/lib/units";

const formSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").trim(),
  capacity: z
    .number()
    .finite("Capacidad inválida")
    .nonnegative("Debe ser 0 o mayor"),
  baseUnit: z.enum(["g", "kg", "lb", "oz", "ton"]),
  rows: z
    .number()
    .int("Debe ser un número entero")
    .positive("Debe ser mayor que 0"),
});

type FormValues = z.infer<typeof formSchema>;

type EditWarehouseProps = {
  warehouse: {
    _id: Id<"warehouse">;
    organizationId: Id<"organizations">;
    name: string;
    capacity: number;
    row: number;
    baseUnit: "g" | "kg" | "lb" | "oz" | "ton";
  };
};

export default function EditWarehouse({ warehouse }: EditWarehouseProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const editWarehouse = useMutation(api.warehouse.editWarehouse);
  const deleteWarehouse = useMutation(api.warehouse.deleteWarehouse);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: warehouse.name,
      capacity: convertFromCanonical(warehouse.capacity, warehouse.baseUnit),
      baseUnit: warehouse.baseUnit,
      rows: warehouse.row,
    },
    mode: "onSubmit",
  });

  useEffect(() => {
    form.reset({
      name: warehouse.name,
      capacity: convertFromCanonical(warehouse.capacity, warehouse.baseUnit),
      baseUnit: warehouse.baseUnit,
      rows: warehouse.row,
    });
  }, [warehouse, form]);

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      await deleteWarehouse({ warehouseId: warehouse._id });
      toast.success("Bodega eliminada correctamente");
      setIsDeleteConfirmOpen(false);
      setOpen(false);
    } catch (e) {
      toast.error(
        "Tenemos problemas para eliminar la bodega, inténtalo más tarde",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger className="cursor-pointer" onClick={() => setOpen(true)}>
          <SquarePen className="size-6 text-primary" />
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
                onSubmit={form.handleSubmit(async (data) => {
                  try {
                    setIsLoading(true);
                    await editWarehouse({
                      warehouseId: warehouse._id,
                      name: data.name,
                      row: data.rows,
                      capacity: convertToCanonical(
                        data.capacity,
                        data.baseUnit,
                      ),
                      baseUnit: data.baseUnit,
                    });
                    toast.success("Bodega actualizada correctamente");
                    setOpen(false);
                  } catch (e) {
                    toast.error(
                      "Tenemos problemas para actualizar la bodega, inténtalo más tarde",
                    );
                  } finally {
                    setIsLoading(false);
                  }
                })}
                className="px-9 flex flex-col h-full overflow-y-auto"
              >
                <DialogTitle className="mt-7 font-semibold text-lg">
                  Editar Información de la Bodega
                </DialogTitle>
                <p className="text-gray-ligth mt-4 mb-6">
                  Modifique las características de la bodega
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
                    name="baseUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-normal">
                          Unidad base{" "}
                          <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="w-full shrink">
                              <SelectValue placeholder="Kilogramo / Kg" />
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

                <div className="flex justify-between mt-auto gap-4 pt-4 pb-11">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    disabled={isLoading}
                    className="w-[30%]"
                  >
                    Eliminar
                  </Button>
                  <Button
                    type="button"
                    className="w-[30%]"
                    variant="outline"
                    onClick={() => setCancelConfirm(true)}
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>

                  <Button
                    type="submit"
                    className="bg-primary px-4 py-2 rounded text-white w-[30%]"
                    disabled={isLoading}
                  >
                    {isLoading ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente
              la bodega.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
