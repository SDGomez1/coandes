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
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../../../convex/_generated/dataModel";
import { Textarea } from "@/components/ui/textarea";

const CancelConfirmation = ({
  onConfirm,
  onBack,
}: {
  onConfirm: () => void;
  onBack: () => void;
}) => (
  <div className="p-6">
    <h3 className="font-semibold">Confirmar Cancelación</h3>
    <p className="text-sm text-gray-600 mt-2">
      ¿Está seguro de que desea cancelar? Se perderán todos los datos no
      guardados.
    </p>
    <div className="flex justify-end gap-4 mt-6">
      <Button variant="outline" onClick={onBack}>
        Volver
      </Button>
      <Button variant="destructive" onClick={onConfirm}>
        Cancelar
      </Button>
    </div>
  </div>
);

const formSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").trim(),
  details: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type EditSupplierProps = {
  supplier: {
    _id: Id<"suppliers">;
    organizationId: Id<"organizations">;
    name: string;
    details?: string;
  };
};

export default function EditSupplier({ supplier }: EditSupplierProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const editSupplier = useMutation(api.suppliers.editSupplier);
  const deleteSupplier = useMutation(api.suppliers.deleteSupplier);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: supplier.name,
      details: supplier.details,
    },
    mode: "onSubmit",
  });

  useEffect(() => {
    form.reset({
      name: supplier.name,
      details: supplier.details,
    });
  }, [supplier, form]);

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      await deleteSupplier({ supplierId: supplier._id });
      toast.success("Proveedor eliminado correctamente");
      setIsDeleteConfirmOpen(false);
      setOpen(false);
    } catch (e) {
      toast.error(
        "Tenemos problemas para eliminar el proveedor, inténtalo más tarde",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);
      await editSupplier({
        supplierId: supplier._id,
        name: data.name,
        details: data.details,
      });
      toast.success("Proveedor actualizado correctamente");
      setOpen(false);
    } catch (e) {
      console.error(e);
      toast.error(
        "Tuvimos problemas para actualizar el proveedor, inténtalo más tarde",
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
          className="p-0 border-none ring-none min-h-[40vh] flex flex-col"
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
                onSubmit={form.handleSubmit(onSubmit)}
                className="px-9 flex flex-col h-full overflow-y-auto"
              >
                <DialogTitle className="mt-7 font-semibold text-lg">
                  Editar Información del Proveedor
                </DialogTitle>
                <p className="text-gray-ligth mt-4 mb-6">
                  Modifique los detalles del proveedor.
                </p>

                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-normal">
                          Nombre del proveedor{" "}
                          <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Finca La Esmeralda"
                            className="text-xs placeholder:text-xs"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="details"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-normal">
                          Detalles (Opcional)
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Contacto, dirección, etc."
                            className="text-xs placeholder:text-xs"
                            rows={4}
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
                    className="w-[30%]"
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    disabled={isLoading}
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
              el proveedor.
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
