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

export default function CreateNewWarehouse() {
  const [open, setOpen] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      capacity: "",
      unit: "",
      rows: 0,
    },
  });

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
                (data) => {},
                (e) => console.log(e),
              )}
              className="px-9 flex flex-col h-full  overflow-y-auto"
            >
              <DialogTitle className="mt-7 font-semibold text-lg">
                Información de bodega
              </DialogTitle>
              <p className="text-gray-ligth mt-4 mb-6">
                Defina las caracteristicas de la bodega
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
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-normal">
                        Capacidad
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="2000"
                          className="text-xs placeholder:text-xs"
                          type="number"
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
                      <FormLabel>Unidad </FormLabel>
                      <FormControl>
                        <Select
                          {...field}
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full shrink">
                            <SelectValue placeholder="Kilogramo / Kg" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kg">Kilogramo / Kg</SelectItem>
                            <SelectItem value="g">Gramo / g</SelectItem>
                            <SelectItem value="t">Tonelada / t</SelectItem>
                            <SelectItem value="lb">Libra / lb</SelectItem>
                            <SelectItem value="oz">Onza / oz</SelectItem>
                          </SelectContent>
                        </Select>
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
                        Filas disponibles
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="CR-IND"
                          type="number"
                          className="text-xs placeholder:text-xs "
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
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  className="bg-primary px-4 py-2 rounded text-white w-1/2 shrink"
                >
                  Terminar
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
const formSchema = z.object({
  name: z.string(),
  capacity: z.string(),
  unit: z.string(),
  rows: z.number(),
});
