"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

const BASE_TYPE_OPTIONS = [
  { value: "Raw Material", label: "Materia Prima" },
  { value: "Finished Good", label: "Producto Terminado" },
  { value: "By-product", label: "Subproducto" },
];

export default function ProductTypesManager() {
  const org = useQuery(api.organizations.getOrg);
  const orgId = org?._id;

  const productTypes = useQuery(
    (api as any).productTypes.getProductTypes,
    orgId ? { organizationId: orgId } : "skip",
  ) as
    | Array<{
        _id: string;
        name: string;
        baseType: "Raw Material" | "Finished Good" | "By-product";
      }>
    | undefined;

  const createProductType = useMutation((api as any).productTypes.createProductType);
  const updateProductType = useMutation((api as any).productTypes.updateProductType);
  const deleteProductType = useMutation((api as any).productTypes.deleteProductType);

  const [name, setName] = useState("");
  const [baseType, setBaseType] = useState<"Raw Material" | "Finished Good" | "By-product">("Raw Material");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const editingItem = useMemo(
    () => (productTypes ?? []).find((pt) => pt._id === editingId),
    [editingId, productTypes],
  );

  const resetForm = () => {
    setName("");
    setBaseType("Raw Material");
    setEditingId(null);
  };

  const onSubmit = async () => {
    if (!orgId) return;
    if (!name.trim()) {
      toast.error("El nombre del tipo es obligatorio.");
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        await updateProductType({
          productTypeId: editingId,
          name,
          baseType,
        });
        toast.success("Tipo de producto actualizado.");
      } else {
        await createProductType({
          organizationId: orgId,
          name,
          baseType,
        });
        toast.success("Tipo de producto creado.");
      }
      resetForm();
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo guardar el tipo de producto.");
    } finally {
      setIsSaving(false);
    }
  };

  const onEdit = (id: string) => {
    const item = (productTypes ?? []).find((pt) => pt._id === id);
    if (!item) return;
    setEditingId(item._id);
    setName(item.name);
    setBaseType(item.baseType);
  };

  const onDelete = async (id: string) => {
    try {
      await deleteProductType({ productTypeId: id });
      toast.success("Tipo de producto eliminado.");
      if (editingId === id) {
        resetForm();
      }
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo eliminar el tipo de producto.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-4 space-y-4">
        <h3 className="font-semibold text-lg">
          {editingItem ? "Editar tipo de producto" : "Nuevo tipo de producto"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Nombre del tipo"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Select value={baseType} onValueChange={(value) => setBaseType(value as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccione categoría base" />
            </SelectTrigger>
            <SelectContent>
              {BASE_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button onClick={onSubmit} disabled={isSaving}>
              {isSaving ? "Guardando..." : editingItem ? "Actualizar" : "Crear"}
            </Button>
            {editingItem && (
              <Button variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoría base</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(productTypes ?? []).map((item) => (
              <TableRow key={item._id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>
                  {BASE_TYPE_OPTIONS.find((o) => o.value === item.baseType)?.label ?? item.baseType}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => onEdit(item._id)}>
                      Editar
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => onDelete(item._id)}>
                      Eliminar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
