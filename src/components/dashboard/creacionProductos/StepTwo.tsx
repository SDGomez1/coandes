import { useFormContext, useWatch } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  FormField,
  FormItem,
  FormControl,
  FormLabel,
} from "@/components/ui/form";
import { DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function StepTwo() {
  const { control, watch } = useFormContext();

  const currentUnit = watch("unitBase");
  const equivalence = watch("equivalence");
  const currentPresentation = watch("presentation");
  const averageWeight = watch("averageWeight");
  return (
    <>
      <DialogTitle className="mt-7 font-semibold text-lg">Unidades</DialogTitle>
      <p className="text-gray-ligth mt-4 mb-6">
        Defina como medir y calcular los resultados del producto en el catálogo.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name="unitBase"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unidad base *</FormLabel>
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
          control={control}
          name="presentation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Presentación</FormLabel>
              <FormControl>
                <Input {...field} placeholder="p. ej. “Bulto”" />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="equivalence"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Equivalencia</FormLabel>
              <FormControl>
                <Input {...field} placeholder="1" type="number" />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="averageWeight"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Peso promedio</FormLabel>
              <FormControl>
                <Input {...field} placeholder="50" type="number" />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
      <p className="font-light text-sm text-gray-ligth my-7 mx-auto">
                {equivalence ? equivalence : 1} {currentPresentation ? currentPresentation : "Bulto"} = {averageWeight ? averageWeight : 50} {currentUnit.length > 0 ?  currentUnit : "Kg"}
      </p>
    </>
  );
}
