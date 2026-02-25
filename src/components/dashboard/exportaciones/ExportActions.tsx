"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import {
  buildExportFile,
  buildExportFileName,
  downloadBlob,
  ExportColumn,
  ExportFormat,
  mapRowsForExport,
} from "@/lib/export-utils";

export function ExportActions<T>({
  organizationId,
  moduleName,
  fileBaseName,
  rows,
  columns,
  className,
}: {
  organizationId?: Id<"organizations">;
  moduleName: string;
  fileBaseName: string;
  rows: T[];
  columns: ExportColumn<T>[];
  className?: string;
}) {
  const createExportRecord = useMutation(api.exportRecords.createExportRecord);
  const generateExportUploadUrl = useMutation(
    api.exportRecords.generateExportUploadUrl,
  );
  const [isExporting, setIsExporting] = useState<ExportFormat | null>(null);

  const handleExport = async (format: ExportFormat) => {
    if (!organizationId) {
      toast.error("No se pudo identificar la organización.");
      return;
    }

    if (rows.length === 0) {
      toast.error("No hay datos para exportar.");
      return;
    }

    setIsExporting(format);
    try {
      const mappedRows = mapRowsForExport(rows, columns);
      const { blob, extension, mimeType } = buildExportFile(mappedRows, format);
      const fileName = buildExportFileName(fileBaseName, extension);

      downloadBlob(blob, fileName);

      try {
        const uploadUrl = await generateExportUploadUrl({});
        const uploadResult = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            "Content-Type": mimeType,
          },
          body: blob,
        });

        if (!uploadResult.ok) {
          throw new Error("No se pudo subir el archivo para historial.");
        }

        const { storageId } = (await uploadResult.json()) as {
          storageId: Id<"_storage">;
        };

        await createExportRecord({
          organizationId,
          module: moduleName,
          fileName,
          format,
          mimeType,
          storageId,
          rowCount: rows.length,
        });
        toast.success("Exportación completada y guardada en historial.");
      } catch (error) {
        console.error(error);
        toast.warning("El archivo se descargó, pero no se guardó en el historial.");
      }
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className={className ?? "flex items-center gap-2"}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => handleExport("csv")}
        disabled={isExporting !== null}
      >
        <Download className="h-4 w-4 mr-1" />
        {isExporting === "csv" ? "Exportando..." : "CSV"}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => handleExport("excel")}
        disabled={isExporting !== null}
      >
        <Download className="h-4 w-4 mr-1" />
        {isExporting === "excel" ? "Exportando..." : "Excel"}
      </Button>
    </div>
  );
}
