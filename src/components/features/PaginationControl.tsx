import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PaginationControlProps {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

const PAGE_SIZE_OPTIONS = [5, 10, 20];

export const PaginationControl: React.FC<PaginationControlProps> = ({
  page,
  limit,
  total,
  onPageChange,
  onLimitChange,
}) => {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd = Math.min(page * limit, total);

  const isFirstPage = page <= 1;
  const isLastPage = page >= totalPages;

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
      {/* Informasi rentang data */}
      <p className="text-sm text-muted-foreground">
        {total === 0 ? (
          "Tidak ada data"
        ) : (
          <>
            Menampilkan{" "}
            <span className="font-semibold text-foreground">{rangeStart}</span>
            {" – "}
            <span className="font-semibold text-foreground">{rangeEnd}</span>{" "}
            dari{" "}
            <span className="font-semibold text-foreground">{total}</span> data
          </>
        )}
      </p>

      <div className="flex items-center gap-3">
        {/* Selector jumlah data per-halaman */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Per halaman:
          </span>
          <Select
            value={String(limit)}
            onValueChange={(val) => {
              onLimitChange(Number(val));
              onPageChange(1); // Reset ke page 1 setiap limit berubah
            }}
          >
            <SelectTrigger className="h-8 w-16">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Navigasi halaman */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(page - 1)}
            disabled={isFirstPage}
            aria-label="Halaman sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="min-w-[80px] text-center text-sm">
            <span className="font-semibold">{page}</span>
            <span className="text-muted-foreground"> / {totalPages}</span>
          </span>

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(page + 1)}
            disabled={isLastPage}
            aria-label="Halaman berikutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
