import * as React from "react";
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

export interface SelectOption {
  value: string;
  label: string;
}

interface InfiniteSelectProps {
  options: SelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  isLoading?: boolean;
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
  className?: string;
  isDisabled?: boolean;
  emptyMessage?: string;
}

export const InfiniteSelect: React.FC<InfiniteSelectProps> = ({
  options,
  selected,
  onChange,
  placeholder = "Pilih...",
  isLoading = false,
  isFetchingNextPage = false,
  hasNextPage = false,
  fetchNextPage,
  className,
  isDisabled = false,
  emptyMessage = "Tidak ada hasil ditemukan.",
}) => {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  // Reset pencarian saat dropdown ditutup
  React.useEffect(() => {
    if (!open) setSearchValue("");
  }, [open]);

  // Observer untuk infinite scroll
  React.useEffect(() => {
    if (!sentinelRef.current || !fetchNextPage || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Implementasi manual filter. Ini mencegah konflik filter internal CMDK 
  // yang dapat merusak interaksi click di dalam Radix Popover.
  const filteredOptions = React.useMemo(() => {
    if (!searchValue) return options;
    const lowerSearch = searchValue.toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(lowerSearch));
  }, [options, searchValue]);

  const toggleOption = (value: string) => {


    if (selected.includes(value)) {
      const newSelected = selected.filter((v) => v !== value);

      onChange(newSelected);
    } else {
      const newSelected = [...selected, value];
      console.log(" New selectedddddd =============>", newSelected);
      onChange(newSelected);
    }
  };

  const removeOption = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((v) => v !== value));
  };

  const selectedLabels = selected.map(
    (val) => options.find((opt) => opt.value === val)?.label ?? val
  );

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={isDisabled}
          className={cn(
            "min-w-[200px] h-auto min-h-10 justify-between flex-wrap gap-1 py-2",
            isDisabled && "opacity-50 cursor-not-allowed",
            className
          )}
        >
          {selected.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {selectedLabels.map((label, i) => (
                <Badge
                  key={selected[i]}
                  variant="secondary"
                  className="flex items-center gap-1 text-xs"
                >
                  {label}
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => removeOption(selected[i], e)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onChange(selected.filter((v) => v !== selected[i]));
                      }
                    }}
                    className="ml-1 rounded-full hover:bg-muted-foreground/20 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </span>
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[280px] p-0 shadow-md" align="start">
        <div className="flex flex-col">
          {/* Custom Search Input */}
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder={`Cari ${placeholder.toLowerCase().replace('pilih ', '')}...`}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>

          {/* Custom List Content */}
          <div className="max-h-[300px] overflow-y-auto overflow-x-hidden p-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memuat data...
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {filteredOptions.map((option) => (
                  <div
                    key={option.value}
                    role="option"
                    aria-selected={selected.includes(option.value)}
                    className={cn(
                      "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
                      selected.includes(option.value) && "bg-accent/40"
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleOption(option.value);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selected.includes(option.value) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="truncate">{option.label}</span>
                  </div>
                ))}

                {/* Sentinel for Infinite Scroll */}
                <div ref={sentinelRef} className="py-1 mt-1">
                  {isFetchingNextPage && (
                    <div className="flex items-center justify-center py-2 text-xs text-muted-foreground">
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Memuat lebih banyak...
                    </div>
                  )}
                  {!hasNextPage && options.length > 0 && (
                    <p className="py-2 text-center text-xs text-muted-foreground">
                      Semua data telah dimuat
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
