"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, PlusIcon, Trash, X } from "lucide-react";
import { useState } from "react";
import { CancelConfirmation } from "./CancelConfirmation";
import { Button } from "@/components/ui/button";
import z from "zod";
import { useFieldArray, useForm, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Form } from "@/components/ui/form";

// Convex
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

// Sonner
import { toast } from "sonner";

// SCHEMA: categories -> factors
const factorSchema = z.object({
  name: z.string().min(1, "El nombre del factor es requerido"),
  unit: z.string().optional(),
});

const categorySchema = z.object({
  name: z.string().min(1, "El nombre de la categoría es requerido"),
  factors: z
    .array(factorSchema)
    .min(1, "Cada categoría debe tener al menos un factor"),
});

const formSchema = z.object({
  categories: z
    .array(categorySchema)
    .min(1, "Debe crear al menos una categoría"),
});

type FormSchema = z.infer<typeof formSchema>;

export default function CreateNewParam({}) {
  const [isOpen, setIsOpen] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const createCatsWithFactors = useMutation(
    api.qualityFactors.createQualityCategoriesWithFactors,
  );

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categories: [],
    },
    mode: "onSubmit",
  });

  const {
    fields: categoryFields,
    append: appendCategory,
    remove: removeCategory,
  } = useFieldArray({
    control: form.control,
    name: "categories",
  });

  const saveNewCategory = () => {
    const name = newCategoryName.trim();
    if (!name) {
      toast.error("Nombre de categoría vacío", {
        description: "Ingresa un nombre para la categoría antes de guardarla.",
      });
      return;
    }
    appendCategory({ name, factors: [] });
    toast.success("Categoría añadida", {
      description: `Se creó la categoría "${name}".`,
    });
    setNewCategoryName("");
    setAddingCategory(false);
  };

  const buildValidationErrors = (errors: any): string[] => {
    const messages: string[] = [];
    if (errors?.categories?.message) {
      messages.push(String(errors.categories.message));
    }
    const catErrors = errors?.categories as Array<any> | undefined;
    if (Array.isArray(catErrors)) {
      catErrors.forEach((catErr, cIdx) => {
        if (!catErr) return;
        const catPrefix = `Categoría ${cIdx + 1}`;
        if (catErr.name?.message) {
          messages.push(`${catPrefix}: ${catErr.name.message}`);
        }
        if (catErr.factors?.message) {
          messages.push(`${catPrefix}: ${catErr.factors.message}`);
        }
        const factorErrors = catErr.factors as Array<any> | undefined;
        if (Array.isArray(factorErrors)) {
          factorErrors.forEach((fErr, fIdx) => {
            if (!fErr) return;
            const facPrefix = `${catPrefix} · Factor ${fIdx + 1}`;
            if (fErr.name?.message) {
              messages.push(`${facPrefix}: ${fErr.name.message}`);
            }
            if (fErr.unit?.message) {
              messages.push(`${facPrefix}: ${fErr.unit.message}`);
            }
          });
        }
      });
    }
    return messages;
  };

  const onInvalid = (errors: any) => {
    const msgs = buildValidationErrors(errors);
    if (msgs.length === 0) {
      toast.error("Datos inválidos", {
        description:
          "Revisa los campos marcados. Asegúrate de agregar al menos una categoría y un factor por categoría.",
      });
      return;
    }
    // Grouped, descriptive error list
    toast.error("No se pudo enviar", {
      description: msgs.slice(0, 6).join("\n"),
    });
  };

  const onSubmit = async (data: FormSchema) => {
    try {
      const promise = createCatsWithFactors({
        categories: data.categories.map((cat) => ({
          name: cat.name,
          factors: cat.factors.map((f) => ({
            name: f.name,
            // unit: f.unit, // include if you add the input
          })),
        })),
      });

      toast.promise(promise, {
        loading: "Guardando categorías y factores...",
        success: (res) =>
          `Se crearon ${res.count} categoría(s) con sus factores.`,
        error: "Error al guardar. Intenta de nuevo.",
      });

      form.reset();
      setIsOpen(false);
    } catch (err: any) {
      toast.error("Error en el envío", {
        description:
          err?.message || "Ocurrió un error al crear categorías y factores.",
      });
    }
  };

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger
        className="flex gap-2 text-xs justify-center items-center border-[#EBE9E9] shadow p-2 rounded border hover:shadow-lg transition-all cursor-pointer"
        onClick={() => setIsOpen(true)}
      >
        <span className="flex size-5 text-black border border-black rounded-full justify-center items-center">
          <PlusIcon className="size-3" />
        </span>
        Crear categorías y factores
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
              setIsOpen(false);
            }}
          />
        ) : (
          <Form {...form}>
            <form
              className="h-full"
              onSubmit={form.handleSubmit(onSubmit, onInvalid)}
            >
              <div className="px-9 flex flex-col h-full pb-11 overflow-y-auto">
                <DialogTitle className="text-lg font-semibold">
                  Categorías de factores de calidad
                </DialogTitle>
                <p className="text-gray-ligth mb-6">
                  Cree categorías y sus factores de calidad.
                </p>

                {categoryFields.length > 0 && (
                  <Accordion type="multiple" className="w-full border-none">
                    {categoryFields.map((cat, cIndex) => (
                      <CategorySection
                        key={cat.id}
                        index={cIndex}
                        categoryId={cat.id}
                        onRemove={() => {
                          removeCategory(cIndex);
                          toast.message("Categoría eliminada");
                        }}
                      />
                    ))}
                  </Accordion>
                )}

                {!addingCategory ? (
                  <button
                    type="button"
                    onClick={() => setAddingCategory(true)}
                    className="w-fit flex justify-center items-center font-medium text-xs hover:underline cursor-pointer mt-2"
                  >
                    <Plus className="mr-2 size-3 text-primary" />
                    Añadir una nueva categoría
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Nombre de la categoría (p. ej. Físico-Químicos)"
                      className="max-w-md text-xs placeholder:text-xs"
                    />
                    <Button
                      type="button"
                      onClick={saveNewCategory}
                      className="text-xs"
                    >
                      Guardar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="text-xs"
                      onClick={() => {
                        setNewCategoryName("");
                        setAddingCategory(false);
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                )}

                <div className="flex justify-between mt-auto gap-4 pt-4">
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
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? "Guardando..." : "Terminar"}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CategorySection({
  index,
  categoryId,
  onRemove,
}: {
  index: number;
  categoryId: string;
  onRemove: () => void;
}) {
  const { control, watch } = useFormContext<FormSchema>();
  const {
    fields: factorFields,
    append: appendFactor,
    remove: removeFactor,
  } = useFieldArray({
    control,
    name: `categories.${index}.factors`,
  });

  const [addingFactor, setAddingFactor] = useState(false);
  const [newFactorName, setNewFactorName] = useState("");

  const categoryName = watch(`categories.${index}.name`);

  const saveNewFactor = () => {
    const name = newFactorName.trim();
    if (!name) {
      toast.error("Nombre de factor vacío", {
        description: "Ingresa un nombre para el factor antes de guardarlo.",
      });
      return;
    }
    appendFactor({ name });
    toast.success("Factor añadido", {
      description: `Se creó el factor "${name}" en "${categoryName}".`,
    });
    setNewFactorName("");
    setAddingFactor(false);
  };

  return (
    <AccordionItem value={categoryId}>
      <div className="flex items-center justify-between pr-2">
        <AccordionTrigger
          showChevronIcon={false}
          className="cursor-pointer !m-0 !py-1"
        >
          <div className="flex gap-4 justify-baseline items-center text-xs">
            <span className="text-primary">{">"}</span>{" "}
            {categoryName || "Categoría"}
          </div>
        </AccordionTrigger>
        <div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="text-red-500"
            title="Eliminar categoría"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <AccordionContent className="px-4 pb-4">
        <div className="mt-2 grid grid-cols-1">
          {factorFields.map((factor, fIndex) => (
            <div key={factor.id} className="flex items-center">
              <p className="m-0 text-xs">
                -{" "}
                {watch(`categories.${index}.factors.${fIndex}.name`) as string}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  removeFactor(fIndex);
                  toast.message("Factor eliminado");
                }}
                className="text-gray"
                title="Eliminar factor"
              >
                <Trash className="size-4" />
              </Button>
            </div>
          ))}
        </div>

        {!addingFactor ? (
          <button
            type="button"
            onClick={() => setAddingFactor(true)}
            className="my-2 flex items-center gap-1 text-xs cursor-pointer hover:underline"
          >
            <Plus className="mr-2 size-3 text-gray" />
            Añadir factor
          </button>
        ) : (
          <div className="flex items-center gap-2 my-2">
            <Input
              value={newFactorName}
              onChange={(e) => setNewFactorName(e.target.value)}
              placeholder='Nombre del factor (p. ej. "% Humedad")'
              className="max-w-md !text-xs placeholder:text-xs"
            />
            <Button type="button" onClick={saveNewFactor} className="text-xs">
              Guardar
            </Button>
            <Button
              type="button"
              variant="outline"
              className="text-xs"
              onClick={() => {
                setNewFactorName("");
                setAddingFactor(false);
              }}
            >
              Cancelar
            </Button>
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
