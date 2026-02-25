"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type ExportFormatFilter = "all" | "csv" | "excel";

function formatRelativeDate(timestamp: number) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "hace unos segundos";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes} minuto${minutes === 1 ? "" : "s"}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} hora${hours === 1 ? "" : "s"}`;
  const days = Math.floor(hours / 24);
  return `hace ${days} día${days === 1 ? "" : "s"}`;
}

function formatExpirationDate(expiresAt: number) {
  const diff = expiresAt - Date.now();
  if (diff <= 0) return "expirado";
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days >= 30) {
    const months = Math.round(days / 30);
    return `en ${months} mes${months === 1 ? "" : "es"}`;
  }
  return `en ${days} día${days === 1 ? "" : "s"}`;
}

export default function ExportsHistoryTable() {
  const router = useRouter();
  const organization = useQuery(api.organizations.getOrg);
  const orgId = organization?._id;
  const [formatFilter, setFormatFilter] = useState<ExportFormatFilter>("all");
  const deleteExportRecord = useMutation(api.exportRecords.deleteExportRecord);

  const records = useQuery(
    api.exportRecords.getExportHistory,
    orgId
      ? {
          organizationId: orgId as Id<"organizations">,
          format: formatFilter === "all" ? undefined : formatFilter,
        }
      : "skip",
  );

  const sortedRecords = useMemo(() => records ?? [], [records]);

  const handleDelete = async (exportRecordId: Id<"exportRecords">) => {
    try {
      await deleteExportRecord({ exportRecordId });
      toast.success("Exportación eliminada del historial.");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo eliminar la exportación.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-gray-600">
          Recupera aquí tus exportaciones. Se generan en segundo plano y pueden tardar unos segundos.
        </p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Formato</span>
            <Select
              value={formatFilter}
              onValueChange={(value) => setFormatFilter(value as ExportFormatFilter)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="button" variant="outline" onClick={() => router.refresh()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Actualizar
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#f9f9f9]">
              <TableHead>NOMBRE DE ARCHIVO</TableHead>
              <TableHead>FORMATO</TableHead>
              <TableHead>CREADO</TableHead>
              <TableHead>EXPIRA</TableHead>
              <TableHead className="text-right">ACCIONES</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-gray-500 py-8">
                  No hay exportaciones registradas.
                </TableCell>
              </TableRow>
            ) : (
              sortedRecords.map((record) => (
                <TableRow key={record._id}>
                  <TableCell className="font-medium">{record.fileName}</TableCell>
                  <TableCell>
                    <span className="inline-flex rounded border px-2 py-0.5 text-xs">
                      {record.format === "csv" ? "CSV" : "Excel"}
                    </span>
                  </TableCell>
                  <TableCell>{formatRelativeDate(record.createdAt)}</TableCell>
                  <TableCell>{formatExpirationDate(record.expiresAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-2">
                      <Button
                        asChild
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={!record.downloadUrl}
                      >
                        <a href={record.downloadUrl ?? "#"} target="_blank" rel="noreferrer">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(record._id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
