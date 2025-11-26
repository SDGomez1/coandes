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

export default function CreateNewSupplier() {
  const org = useQuery(api.organizations.getOrg);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const createSupplier = useMutation(api.suppliers.createSupplier);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      details: "",
    },
    mode: "onSubmit",
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);
      await createSupplier({
        organizationId: org?._id as Id<"organizations">,
        name: data.name,
        details: data.details,
      });
      toast.success("Proveedor creado correctamente");
      form.reset();
      setOpen(false);
    } catch (e) {
      console.error(e);
      toast.error(
        "Tuvimos problemas para crear el proveedor, inténtalo más tarde",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="flex gap-2 text-xs justify-center items-center border-[#EBE9E9] shadow p-2 rounded border hover:shadow-lg transition-all cursor-pointer my-6"
        onClick={() => setOpen(true)}
      >
        <span className="flex size-5 text-black border border-black rounded-full justify-center items-center">
          <XIcon className="rotate-45 size-3" />
        </span>
        Agregar Proveedor
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
                Información del Proveedor
              </DialogTitle>
              <p className="text-gray-ligth mt-4 mb-6">
                Defina los detalles del nuevo proveedor.
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
