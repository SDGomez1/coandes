"use client";

import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export function PaginationControls<T>({ table }: { table: Table<T> }) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const pageCount = table.getPageCount();
  const totalRows = table.getFilteredRowModel().rows.length;

  const getPageNumbers = () => {
    const pages = new Set<number>();
    pages.add(0);
    pages.add(pageCount - 1);

    if (pageCount <= 5) {
      for (let i = 0; i < pageCount; i++) pages.add(i);
    } else {
      if (pageIndex > 2) pages.add(pageIndex - 1);
      pages.add(pageIndex);
      if (pageIndex < pageCount - 2) pages.add(pageIndex + 1);
    }

    const pageList = Array.from(pages).sort((a, b) => a - b);
    const result: number[] = [];
    let lastPage = -1;

    for (const page of pageList) {
      if (lastPage !== -1 && page - lastPage > 1) {
        result.push(-1); // Ellipsis
      }
      result.push(page);
      lastPage = page;
    }

    return result;
  };

  const start = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const end = Math.min(start + pageSize - 1, totalRows);

  return (
    <div className="flex items-center justify-between p-4 flex-col gap-4 lg:flex-row"> 
      <span className="text-sm text-muted-foreground">
        Mostrando {start} a {end} de {totalRows} resultados
      </span>
      <div className="flex items-center flex-col lg:flex-row gap-4">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>

          {getPageNumbers().map((page, i) =>
            page === -1 ? (
              <span key={`ellipsis-${i}`} className="px-2 text-sm">
                ...
              </span>
            ) : (
              <Button
                key={page}
                variant={page === pageIndex ? "default" : "outline"}
                size="icon"
                onClick={() => table.setPageIndex(page)}
              >
                {page + 1}
              </Button>
            ),
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.setPageIndex(pageCount - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>

        <Select
          value={String(pageSize)}
          onValueChange={(value) => {
            table.setPageSize(Number(value));
          }}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue
              placeholder="Selecione"
            />
          </SelectTrigger>
          <SelectContent>
            {[5, 10, 20, 30, 40, 50].map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size} / página
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
