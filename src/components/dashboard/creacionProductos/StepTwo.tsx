import { useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { WEIGHT_UNIT_OPTIONS, WeightUnit } from "@/lib/units";

export default function StepTwo() {
  const { control, watch } = useFormContext();

  const currentUnit = watch("unitBase") as WeightUnit;
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
                    <SelectValue placeholder="Seleccionar unidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {WEIGHT_UNIT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
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
                <Input
                  {...field}
                  type="number"
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === ""
                        ? 0
                        : Number(e.target.value),
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <p className="font-light text-sm text-gray-ligth my-7 mx-auto">
        {equivalence ? equivalence : 1}{" "}
        {currentPresentation ? currentPresentation : ""} = {averageWeight}{" "}
        {currentUnit.length > 0 ? currentUnit : "Kg"}
      </p>
    </>
  );
}
