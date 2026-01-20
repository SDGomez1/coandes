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
    const pageIndex = table.getState().pagination.pageIndex;
    const pageCount = table.getPageCount();

    const getPageNumbers = () => {
        const pages = new Set<number>();
        pages.add(0);
        pages.add(pageCount - 1);

        if (pageCount <= 5) {
            for (let i = 0; i < pageCount; i++) pages.add(i);
        } else {
            if (pageIndex > 2) {
                pages.add(pageIndex - 1);
            }
            if (pageIndex > 1) {
                pages.add(pageIndex);
            }
            if (pageIndex < pageCount - 2) {
                pages.add(pageIndex + 1);
            }
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

    const start = pageIndex * table.getState().pagination.pageSize + 1;
    const end = Math.min(
        start + table.getState().pagination.pageSize - 1,
        table.getFilteredRowModel().rows.length,
    );

    return (
        <div className="flex items-center justify-between p-4">
            <span className="text-sm text-gray-700">
                Mostrando {start} a {end} de {table.getFilteredRowModel().rows.length}{" "}
                resultados
            </span>
            <div className="flex items-center gap-2">
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
                        <span key={`ellipsis-${i}`} className="px-2">
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
                <Select
                    value={String(table.getState().pagination.pageSize)}
                    onValueChange={(value) => {
                        table.setPageSize(Number(value));
                    }}
                >
                    <SelectTrigger className="w-28">
                        <SelectValue
                            placeholder={`${table.getState().pagination.pageSize} / página`}
                        />
                    </SelectTrigger>
                    <SelectContent>
                        {[5, 20, 30, 40, 50].map((size) => (
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
