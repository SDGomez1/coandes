import Papa from "papaparse";

export type ExportFormat = "csv" | "excel";

export type ExportColumn<T> = {
  header: string;
  value: (row: T) => string | number | boolean | null | undefined;
};

type BuildExportResult = {
  blob: Blob;
  extension: "csv" | "xls";
  mimeType: string;
};

function sanitizeCell(value: unknown): string | number | boolean {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  return JSON.stringify(value);
}

function escapeHtml(raw: string): string {
  return raw
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function mapRowsForExport<T>(rows: T[], columns: ExportColumn<T>[]) {
  return rows.map((row) => {
    const mapped: Record<string, string | number | boolean> = {};
    for (const column of columns) {
      mapped[column.header] = sanitizeCell(column.value(row));
    }
    return mapped;
  });
}

function buildCsvBlob(rows: Record<string, string | number | boolean>[]): BuildExportResult {
  const csv = Papa.unparse(rows);
  const blob = new Blob(["\ufeff", csv], {
    type: "text/csv;charset=utf-8;",
  });

  return {
    blob,
    extension: "csv",
    mimeType: "text/csv",
  };
}

function buildExcelBlob(
  rows: Record<string, string | number | boolean>[],
  headers: string[],
): BuildExportResult {
  const headerHtml = headers
    .map((header) => `<th>${escapeHtml(header)}</th>`)
    .join("");
  const bodyHtml = rows
    .map((row) => {
      const cells = headers
        .map((header) => `<td>${escapeHtml(String(row[header] ?? ""))}</td>`)
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  const html = `
    <html>
      <head>
        <meta charset="UTF-8" />
      </head>
      <body>
        <table border="1">
          <thead>
            <tr>${headerHtml}</tr>
          </thead>
          <tbody>${bodyHtml}</tbody>
        </table>
      </body>
    </html>
  `.trim();

  const blob = new Blob([html], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });

  return {
    blob,
    extension: "xls",
    mimeType: "application/vnd.ms-excel",
  };
}

export function buildExportFile(
  rows: Record<string, string | number | boolean>[],
  format: ExportFormat,
): BuildExportResult {
  if (rows.length === 0) {
    if (format === "csv") {
      return buildCsvBlob([]);
    }
    return buildExcelBlob([], []);
  }

  if (format === "csv") {
    return buildCsvBlob(rows);
  }

  return buildExcelBlob(rows, Object.keys(rows[0]));
}

export function downloadBlob(blob: Blob, fileName: string) {
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(href);
}

export function buildExportFileName(baseName: string, extension: "csv" | "xls") {
  const now = new Date();
  const timestamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-") +
    "-" +
    [
      String(now.getHours()).padStart(2, "0"),
      String(now.getMinutes()).padStart(2, "0"),
      String(now.getSeconds()).padStart(2, "0"),
    ].join("");

  const normalizedBase = baseName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");

  return `export-${normalizedBase}-${timestamp}.${extension}`;
}
