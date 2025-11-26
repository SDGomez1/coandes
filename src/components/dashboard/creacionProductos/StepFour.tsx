"use client";

import { useQuery } from "convex/react";
import { useFormContext } from "react-hook-form";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogTitle } from "@radix-ui/react-dialog";
import { LoadingSpinner } from "@/assets/icons/LoadingSpinner";

export default function StepFour() {
  const { control } = useFormContext();
    const org = useQuery(api.organizations.getOrg)
  const products = useQuery(api.products.getProducts, {
    organizationId: org?._id as Id<"organizations">,
  });

  return (
    <>
      <DialogTitle className="mt-7 font-semibold text-lg">
        Definir Salidas de Producción
      </DialogTitle>
      <p className="text-gray-ligth mt-4 mb-6">
        Seleccione los productos que pueden resultar de la producción de este
        item.
      </p>
      <FormField
        control={control}
        name="outputProductIds"
        render={({ field }) => (
          <FormItem>
            <div className="mb-4">
              <FormLabel className="text-base">Productos Resultantes</FormLabel>
              <FormDescription>
                Seleccione uno o más productos.
              </FormDescription>
            </div>
            <div className="flex flex-col space-y-2 max-h-60 overflow-y-auto">
              {products === undefined && <LoadingSpinner />}
              {products?.map((product) => (
                <FormField
                  key={product._id}
                  control={control}
                  name="outputProductIds"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={product._id}
                        className="flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(product._id)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, product._id])
                                : field.onChange(
                                    field.value?.filter(
                                      (value: string) => value !== product._id
                                    )
                                  );
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {product.name} ({product.type})
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
    </>
  );
}
