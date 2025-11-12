"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFormContext } from "react-hook-form";

export default function ReceptionForm() {
  const form = useFormContext();
  return (
    <div className="flex gap-8 flex-wrap mt-7">
      <FormField
        control={form.control}
        name="ticketNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs">N° Tiquete</FormLabel>
            <FormControl>
              <Input placeholder="1111" {...field} />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="provider"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs">Producto</FormLabel>
            <FormControl>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="CRISTAL INDUSTRIAL" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product"></SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="warehouse"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs">Proveedor</FormLabel>
            <FormControl>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="CRISTAL INDUSTRIAL" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product"></SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="product"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs">Bodega</FormLabel>
            <FormControl>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="CRISTAL INDUSTRIAL" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product"></SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="vehicleLicence"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs">Placa Vehículo</FormLabel>
            <FormControl>
              <Input placeholder="ABC123" {...field} />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="presentation"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs">Bultos</FormLabel>
            <FormControl>
              <Input placeholder="1" {...field} type="number" />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="vehicleLicence"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs">Peso/Kg</FormLabel>
            <FormControl>
              <Input placeholder="1" {...field} type="number" />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}
