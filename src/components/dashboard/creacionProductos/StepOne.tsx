import { useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormField,
  FormItem,
  FormControl,
  FormLabel,
} from "@/components/ui/form";
import { DialogTitle } from "@/components/ui/dialog";

const normalizeText = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/ñ/gi, "n")
    .trim();

const generateSKU = (name: string): string => {
  if (!name) return "";

  const normalized = normalizeText(name).toUpperCase();

  if (/^\d+$/.test(normalized)) {
    return `P-${normalized}`;
  }

  if (/^[A-Z]$/.test(normalized)) {
    return normalized;
  }

  const words = normalized.split(/\s+/);

  const parts: string[] = [];

  const firstWord = words[0];
  if (firstWord.length >= 3) {
    parts.push(firstWord.slice(0, 2));
  } else {
    parts.push(firstWord);
  }
  for (let i = 1; i < words.length; i++) {
    let w = words[i];

    if (w.match(/\d/)) {
      w = w.replace(/[^0-9]/g, "");
    } else if (w.length > 3) {
      w = w.slice(0, 3);
    }

    parts.push(w);
  }

  return parts.filter(Boolean).join("-");
};

export default function StepOne() {
  const { control, setValue } = useFormContext();
  const productName = useWatch({ control, name: "productName" });

  useEffect(() => {
    const autoSKU = generateSKU(productName || "");
    setValue("sku", autoSKU);
  }, [productName, setValue]);

  return (
    <>
      <DialogTitle className="mt-7 font-semibold text-lg">
        Información básica
      </DialogTitle>
      <p className="text-gray-ligth mt-4 mb-6">
        Defina la identidad y el tipo del producto en el catálogo.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name="productName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-normal">
                Nombre del producto <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Cristal industrial"
                  className="text-xs placeholder:text-xs"
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="sku"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-normal">
                Código / SKU<span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="CR-IND"
                  className="text-xs placeholder:text-xs bg-gray-100"
                  readOnly
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
      <div className="grid grid-cols-1 mt-4">
        <FormField
          control={control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-normal">
                Tipo de producto <span className="text-destructive">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Raw Material">Materia Prima</SelectItem>
                  <SelectItem value="Finished Good">Producto Terminado</SelectItem>
                  <SelectItem value="By-product">Subproducto</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      </div>
    </>
  );
}
