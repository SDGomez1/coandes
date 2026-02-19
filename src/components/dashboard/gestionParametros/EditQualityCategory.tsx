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
import { Plus, SquarePen, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { CancelConfirmation } from "./CancelConfirmation";
import { Button } from "@/components/ui/button";
import z from "zod";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../../../convex/_generated/dataModel";

const factorSchema = z.object({
  id: z.optional(z.string()),
  name: z.string().min(1, "El nombre del factor es requerido"),
  unit: z.string().optional(),
});

const formSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "El nombre de la categoría es requerido"),
  factors: z
    .array(factorSchema)
    .min(1, "La categoría debe tener al menos un factor"),
});

type FormSchema = z.infer<typeof formSchema>;

type EditQualityCategoryProps = {
  category: {
    _id: Id<"qualityFactorsCategory">;
    name: string;
  };
  factors: {
    _id: Id<"qualityFactors">;
    name: string;
    unit?: string;
  }[];
};

export default function EditQualityCategory({
  category,
  factors,
}: EditQualityCategoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [newFactorName, setNewFactorName] = useState("");
  const [deletingFactorIndex, setDeletingFactorIndex] = useState<number | null>(
    null,
  );
  const [isDeleteCategoryConfirmOpen, setIsDeleteCategoryConfirmOpen] =
    useState(false);

  const editCategoryWithFactors = useMutation(
    api.qualityFactors.editQualityCategoryWithFactors,
  );
  const deleteCategoryMutation = useMutation(
    api.qualityFactors.deleteQualityCategory,
  );

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: category._id,
      name: category.name,
      factors: factors.map((f) => ({ id: f._id, name: f.name, unit: f.unit })),
    },
    mode: "onSubmit",
  });

  useEffect(() => {
    form.reset({
      id: category._id,
      name: category.name,
      factors: factors.map((f) => ({ id: f._id, name: f.name, unit: f.unit })),
    });
  }, [category, factors, form]);

  const {
    fields: factorFields,
    append: appendFactor,
    remove: removeFactor,
  } = useFieldArray({
    control: form.control,
    name: "factors",
  });

  const onInvalid = (errors: any) => {
    const message = `Error al editar la categoría. ${errors.factors?.root?.message ?? ""}`;
    toast.error(message);
  };

  const onSubmit = async (data: FormSchema) => {
    const promise = editCategoryWithFactors({
      category: {
        id: data.id as Id<"qualityFactorsCategory">,
        name: data.name,
        factors: data.factors.map((f) => ({
          id: f.id as Id<"qualityFactors"> | undefined,
          name: f.name,
          unit: f.unit,
        })),
      },
    });
    toast.promise(promise, {
      loading: "Editando categoría...",
      success: "Categoría editada exitosamente",
      error: "Error al editar la categoría",
    });
    setIsOpen(false);
  };

  const handleAddFactor = () => {
    if (newFactorName.trim()) {
      appendFactor({ name: newFactorName.trim(), unit: "" });
      setNewFactorName("");
    } else {
      toast.error("El nombre del factor no puede estar vacío");
    }
  };

  const handleDeleteFactor = () => {
    if (deletingFactorIndex !== null) {
      removeFactor(deletingFactorIndex);
      setDeletingFactorIndex(null);
      toast.success("Factor eliminado");
    }
  };

  const handleDeleteCategory = async () => {
    const promise = deleteCategoryMutation({
      categoryId: category._id,
    });
    toast.promise(promise, {
      loading: "Eliminando categoría...",
      success: "Categoría eliminada exitosamente",
      error: "Error al eliminar la categoría",
    });
    setIsDeleteCategoryConfirmOpen(false);
    setIsOpen(false);
  };

  return (
    <>
      <Dialog onOpenChange={setIsOpen} open={isOpen}>
        <DialogTrigger
          className="cursor-pointer"
          onClick={() => setIsOpen(true)}
        >
          <SquarePen className="size-6 text-primary" />
        </DialogTrigger>

        <DialogContent
          showCloseButton={false}
          className="p-0 border-none ring-none min-h-[400px] flex flex-col"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className="bg-primary w-full h-12 rounded-t-lg" />
          {cancelConfirm ? (
            <CancelConfirmation
              onBack={() => setCancelConfirm(false)}
              onConfirm={() => {
                setCancelConfirm(false);
                form.reset();
                setIsOpen(false);
              }}
              isEditing
            />
          ) : (
            <Form {...form}>
              <form
                className="h-full"
                onSubmit={form.handleSubmit(onSubmit, onInvalid)}
              >
                <div className="px-9 flex flex-col h-full pb-11 overflow-y-auto">
                  <DialogTitle className="text-lg font-semibold">
                    Editar Categoría de parámetro calidad
                  </DialogTitle>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>Nombre de categoría</FormLabel>
                        <Input {...field} className="" />
                      </FormItem>
                    )}
                  />

                  <div className="mt-4">
                    <h3 className="text-md font-semibold">Factores</h3>
                    <div className="space-y-2 mt-2">
                      {factorFields.map((field, index) => (
                        <div key={field.id} className="flex items-center gap-2">
                          <FormField
                            control={form.control}
                            name={`factors.${index}.name`}
                            render={({ field }) => (
                              <FormItem className="flex-grow">
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="Nombre del factor"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingFactorIndex(index)}
                          >
                            <Trash className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <Input
                        value={newFactorName}
                        onChange={(e) => setNewFactorName(e.target.value)}
                        placeholder="Nuevo factor"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddFactor();
                          }
                        }}
                      />
                      <Button type="button" onClick={handleAddFactor}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-between mt-auto pt-4 w-full">
                    <Button
                      type="button"
                      variant="destructive"
                      className="w-[30%]"
                      onClick={() => setIsDeleteCategoryConfirmOpen(true)}
                    >
                      Eliminar Categoría
                    </Button>
                    <Button
                      type="button"
                      className="w-[30%]"
                      variant="outline"
                      onClick={() => setCancelConfirm(true)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      className="bg-primary px-4 py-2 rounded text-white w-[30%]"
                      disabled={form.formState.isSubmitting}
                    >
                      {form.formState.isSubmitting
                        ? "Guardando..."
                        : "Guardar Cambios"}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={deletingFactorIndex !== null}
        onOpenChange={(open) => !open && setDeletingFactorIndex(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente
              el factor y todos sus datos relacionados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingFactorIndex(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFactor}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={isDeleteCategoryConfirmOpen}
        onOpenChange={setIsDeleteCategoryConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente
              la categoría y todos los factores asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
