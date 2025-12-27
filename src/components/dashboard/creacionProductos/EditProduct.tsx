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
import { CancelConfirmation } from "./CancelConfirmation";
import z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Doc, Id } from "../../../../convex/_generated/dataModel";
import {
  convertFromCanonical,
  convertToCanonical,
  WEIGHT_UNIT_OPTIONS,
} from "@/lib/units";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingSpinner } from "@/assets/icons/LoadingSpinner";

const formSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").trim(),
  sku: z.string().min(1, "El SKU es obligatorio").trim(),
  type: z.enum(["Raw Material", "Finished Good", "By-product"]),
  baseUnit: z.enum(["g", "kg", "lb", "oz", "ton"]),
  presentation: z.string().optional(),
  equivalence: z.string().optional(),
  averageWeight: z.number().optional(),
  qualityFactorsId: z.array(z.string()).optional(),
  outputProductIds: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

type EditProductProps = {
  product: Doc<"products">;
};

export default function EditProduct({ product }: EditProductProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const updateProduct = useMutation(api.products.updateProduct);
  const deleteProduct = useMutation(api.products.deleteProduct);
  const updateProductOutputs = useMutation(api.products.updateProductOutputs);

  const org = useQuery(api.organizations.getOrg);
  const allProducts = useQuery(api.products.getProducts, {
    organizationId: org?._id as Id<"organizations">,
  });
  const possibleOutputs = useQuery(api.products.getPossibleOutputs, {
    inputProductId: product._id,
  });

  const categoriesWithFactors = useQuery(
    api.qualityFactors.listCategoriesWithFactorsByOrganization,
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: product.name,
      sku: product.sku,
      type: product.type,
      baseUnit: product.baseUnit,
      presentation: product.presentation,
      equivalence: product.equivalence,
      averageWeight: convertFromCanonical(
        product.averageWeight,
        product.baseUnit,
      ),
      qualityFactorsId: product.qualityFactorsId as string[],
      outputProductIds: [],
    },
    mode: "onSubmit",
  });

  useEffect(() => {
    if (possibleOutputs) {
      form.reset({
        name: product.name,
        sku: product.sku,
        type: product.type,
        baseUnit: product.baseUnit,
        presentation: product.presentation,
        equivalence: product.equivalence,
        averageWeight: convertFromCanonical(product.averageWeight, product.baseUnit),
        qualityFactorsId: product.qualityFactorsId as string[],
        outputProductIds: possibleOutputs.map((p) => p!._id),
      });
    }
  }, [product, form, possibleOutputs]);

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      await deleteProduct({ productId: product._id });
      toast.success("Producto eliminado correctamente");
      setIsDeleteConfirmOpen(false);
      setOpen(false);
    } catch (e) {
      toast.error(
        "Tenemos problemas para eliminar el producto, inténtalo más tarde",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const productType = form.watch("type");

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon">
            <SquarePen className="size-6 text-primary" />
          </Button>
        </DialogTrigger>

        <DialogContent
          showCloseButton={false}
          className="p-0 border-none ring-none max-h-[90vh] flex flex-col overflow-y-auto"
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
                    await updateProduct({
                      productId: product._id,
                      name: data.name,
                      sku: data.sku,
                      type: data.type,
                      baseUnit: data.baseUnit,
                      presentation: data.presentation,
                      equivalence: data.equivalence,
                      averageWeight: convertToCanonical(
                        data.averageWeight ?? 0,
                        data.baseUnit,
                      ),
                      qualityFactorsId:
                        data.qualityFactorsId as Id<"qualityFactors">[],
                    });

                    if (
                      data.outputProductIds &&
                      (product.type === "Raw Material" ||
                        product.type === "By-product")
                    ) {
                      await updateProductOutputs({
                        productId: product._id,
                        outputProductIds:
                          data.outputProductIds as Id<"products">[],
                        organizationId: product.organizationId,
                      });
                    }

                    toast.success("Producto actualizado correctamente");
                    setOpen(false);
                  } catch (e) {
                    console.error(e);
                    toast.error(
                      "Tenemos problemas para actualizar el producto, inténtalo más tarde",
                    );
                  } finally {
                    setIsLoading(false);
                  }
                })}
                className="px-9 flex flex-col h-full"
              >
                <DialogTitle className="mt-7 font-semibold text-lg">
                  Editar Información del Producto
                </DialogTitle>
                <p className="text-gray-ligth mt-4 mb-6">
                  Modifique las características del producto
                </p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* Form fields will go here */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Raw Material">
                              Materia Prima
                            </SelectItem>
                            <SelectItem value="Finished Good">
                              Producto Terminado
                            </SelectItem>
                            <SelectItem value="By-product">
                              Subproducto
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="baseUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unidad Base</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {WEIGHT_UNIT_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="presentation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Presentación</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="equivalence"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Equivalencia</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="averageWeight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Peso Promedio</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...form.register("averageWeight", {
                              valueAsNumber: true,
                            })}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="qualityFactorsId"
                  render={() => (
                    <FormItem className="mt-6 mb-6">
                      <FormLabel>Factores de Calidad</FormLabel>
                      <div className="max-h-32 overflow-y-auto border rounded p-2">
                        {categoriesWithFactors?.map(({ category, factors }) => (
                          <div key={category._id}>
                            <h4 className="font-semibold text-sm">
                              {category.name}
                            </h4>
                            {factors.map((factor) => (
                              <FormField
                                key={factor._id}
                                control={form.control}
                                name="qualityFactorsId"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={factor._id}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(
                                            factor._id as string,
                                          )}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([
                                                  ...(field.value ?? []),
                                                  factor._id,
                                                ])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) =>
                                                      value !== factor._id,
                                                  ),
                                                );
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        {factor.name}
                                      </FormLabel>
                                    </FormItem>
                                  );
                                }}
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                    </FormItem>
                  )}
                />

                {(productType === "Raw Material" ||
                  productType === "By-product") && (
                  <FormField
                    control={form.control}
                    name="outputProductIds"
                    render={({ field }) => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel className="text-base">
                            Productos Resultantes
                          </FormLabel>
                          <FormDescription>
                            Seleccione uno o más productos. Solo puede
                            seleccionar Subproductos o Productos Terminados.
                          </FormDescription>
                        </div>
                        <div className="flex flex-col space-y-2 max-h-60 overflow-y-auto border rounded p-2">
                          {allProducts === undefined && <LoadingSpinner />}
                          {allProducts &&
                            allProducts.filter(
                              (p) =>
                                p._id !== product._id &&
                                (p.type === "Finished Good" ||
                                  p.type === "By-product"),
                            ).length === 0 && (
                              <p className="text-sm text-muted-foreground">
                                No hay Subproductos o Productos Terminados
                                disponibles para seleccionar como salida.
                              </p>
                            )}
                          {allProducts
                            ?.filter(
                              (p) =>
                                p._id !== product._id &&
                                (p.type === "Finished Good" ||
                                  p.type === "By-product"),
                            )
                            .map((p) => (
                              <FormField
                                key={p._id}
                                control={form.control}
                                name="outputProductIds"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={p._id}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(p._id)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([
                                                  ...(field.value ?? []),
                                                  p._id,
                                                ])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== p._id,
                                                  ),
                                                );
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        {p.name} ({p.type})
                                      </FormLabel>
                                    </FormItem>
                                  );
                                }}
                              />
                            ))}
                        </div>
                      </FormItem>
                    )}
                  />
                )}

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
              el producto.
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
