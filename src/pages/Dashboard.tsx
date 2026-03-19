import * as React from "react";
import { AlertCircle, Bus, Filter, RefreshCw } from "lucide-react";

import { useVehicles } from "@/hooks/useVehicles";
import { useInfiniteRoutes, useInfiniteTrips } from "@/hooks/useInfiniteResources";
import { Vehicle } from "@/types/mbta";

import { VehicleCard, VehicleCardSkeleton } from "@/components/features/VehicleCard";
import { PaginationControl } from "@/components/features/PaginationControl";
import { InfiniteSelect, SelectOption } from "@/components/features/InfiniteSelect";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { VehicleDetailModal } from "@/components/features/VehicleDetailModal";
import { ThemeToggle } from "@/components/theme-toggle";

const Dashboard: React.FC = () => {
  // ── State ────────────────────────────────────────────────────────────────
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);
  const [selectedRoutes, setSelectedRoutes] = React.useState<string[]>([]);
  const [selectedTrips, setSelectedTrips] = React.useState<string[]>([]);
  const [selectedVehicle, setSelectedVehicle] = React.useState<Vehicle | null>(null);

  // Reset ke page 1 saat filter berubah
  const handleRoutesChange = (routes: string[]) => {
    setSelectedRoutes(routes);
    setSelectedTrips([]); // ← wajib, trip lama jadi invalid
    setPage(1);
  };
  const handleTripsChange = (trips: string[]) => {
    setSelectedTrips(trips);
    setPage(1);
  };

  // ── Data Hooks ────────────────────────────────────────────────────────────
  const {
    data: vehicleData,
    isLoading,
    isFetching,
    isError,
    error,
    dataUpdatedAt,
  } = useVehicles({
    page,
    limit,
    routeIds: selectedRoutes,
    tripIds: selectedTrips,
  });

  const {
    data: routePages,
    isLoading: routesLoading,
    isFetchingNextPage: routesFetchingNext,
    hasNextPage: routesHasNext,
    fetchNextPage: routesFetchNext,
  } = useInfiniteRoutes();

  const {
    data: tripPages,
    isLoading: tripsLoading,
    isFetchingNextPage: tripsFetchingNext,
    hasNextPage: tripsHasNext,
    fetchNextPage: tripsFetchNext,
  } = useInfiniteTrips(selectedRoutes); // ← fix: pass selectedRoutes agar trip di-fetch sesuai ruteselectedRoutes);

  // Mappinggg
  const routeOptions: SelectOption[] = React.useMemo(
    () =>
      routePages?.pages.flatMap((p) =>
        p.data.map((r) => ({
          value: r.id,
          label: r.attributes.long_name || r.attributes.short_name || r.id,
        }))
      ) ?? [],
    [routePages]
  );

  const tripOptions: SelectOption[] = React.useMemo(
    () =>
      tripPages?.pages.flatMap((p) =>
        p.data.map((t) => {
          const headsign = t.attributes.headsign || t.attributes.name || "Unknown";
          return {
            value: t.id,
            // Tambahkan ID Trip di label agar user sadar ini adalah 1 jadwal spesifik, bukan sekadar arah
            label: `${headsign} (Trip: ${t.id})`,
          };
        })
      ) ?? [],
    [tripPages]
  );

  // ── Derived values ─────────────────────────────────────────────────────────
  const vehicles = vehicleData?.data ?? [];
  // Jika data yg dikembalikan sama dengan limit = kemungkinan masih ada halaman berikutnya.
  const estimatedTotal = React.useMemo(() => {
    const meta = vehicleData?.meta?.pagination;
    if (meta?.total !== undefined) return meta.total;
    // Fallback: jika halaman terisi penuh, tunjukkan minimal ada 1 halaman lagi
    if (vehicles.length === limit) return page * limit + 1;
    return (page - 1) * limit + vehicles.length;
  }, [vehicleData, vehicles.length, limit, page]);

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("id-ID")
    : null;

  const activeFilterCount = selectedRoutes.length + selectedTrips.length;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Bus className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-base font-bold leading-none sm:text-lg">
                  TJ Fleet Management
                </h1>
                <p className="text-xs text-muted-foreground">
                  Sistem Manajemen Armada
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {lastUpdated && (
                <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                  <RefreshCw
                    className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`}
                  />
                  Diperbarui pukul {lastUpdated}
                </span>
              )}
              {isFetching && !isLoading && (
                <Badge variant="secondary" className="animate-pulse text-xs">
                  Menyinkronkan...
                </Badge>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 sm:px-6">
        {/* ── Filter Panel ───────────────────────────────────────────────────── */}
        <section
          className="mb-6 rounded-lg border bg-card p-4"
          aria-label="Panel Filter Kendaraan"
        >
          <div className="mb-3 flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Filter Kendaraan</h2>
            {activeFilterCount > 0 && (
              <Badge className="text-xs">{activeFilterCount} aktif</Badge>
            )}
          </div>

          <div className="flex flex-wrap items-start gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">
                Rute
              </label>
              <InfiniteSelect
                options={routeOptions}
                selected={selectedRoutes}
                onChange={handleRoutesChange}
                placeholder="Pilih Rute"
                isLoading={routesLoading}
                isFetchingNextPage={routesFetchingNext}
                hasNextPage={routesHasNext}
                fetchNextPage={routesFetchNext}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">
                Trip
                {selectedRoutes.length === 0 && (
                  <span className="ml-1 text-muted-foreground/60 font-normal">
                    (pilih rute dulu)
                  </span>
                )}
              </label>
              <InfiniteSelect
                options={tripOptions}
                selected={selectedTrips}
                onChange={handleTripsChange}
                placeholder={selectedRoutes.length === 0 ? "Pilih Rute dulu..." : "Pilih Trip"}
                isDisabled={selectedRoutes.length === 0}
                isLoading={tripsLoading}
                isFetchingNextPage={tripsFetchingNext}
                hasNextPage={tripsHasNext}
                fetchNextPage={tripsFetchNext}
              />
            </div>

            {activeFilterCount > 0 && (
              <div className="flex flex-col justify-end gap-1 self-end pb-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedRoutes([]);
                    setSelectedTrips([]);
                    setPage(1);
                  }}
                  className="text-xs text-destructive hover:text-destructive"
                >
                  Reset Filter
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* ── Error State ─────────────────────────────────────────────────────── */}
        {isError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Gagal Memuat Data Kendaraan</AlertTitle>
            <AlertDescription>
              {(error as Error)?.message ||
                "Terjadi kesalahan saat menghubungi server MBTA. Periksa koneksi internet Anda dan coba lagi."}
            </AlertDescription>
          </Alert>
        )}

        {/* ── Vehicle Grid ────────────────────────────────────────────────────── */}
        {!isError && (
          <>
            <div
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              aria-label="Daftar Kendaraan"
            >
              {isLoading
                ? Array.from({ length: limit }).map((_, i) => (
                  // Tampilkan skeleton sebanyak limit saat loading awal
                  <div key={i} className="relative">
                    <VehicleCardSkeleton />
                  </div>
                ))
                : vehicles.map((vehicle) => (
                  <VehicleCard
                    key={vehicle.id}
                    vehicle={vehicle}
                    onClick={setSelectedVehicle}
                  />
                ))}
            </div>

            {/* Empty State */}
            {!isLoading && vehicles.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
                <Bus className="mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="font-medium text-muted-foreground">
                  Tidak ada kendaraan ditemukan
                </p>
                <p className="mt-1 text-sm text-muted-foreground/70">
                  Coba ubah atau reset filter yang aktif
                </p>
              </div>
            )}

            {/* ── Pagination ─────────────────────────────────────────────────── */}
            {!isLoading && vehicles.length > 0 && (
              <div className="mt-6">
                <PaginationControl
                  page={page}
                  limit={limit}
                  total={estimatedTotal}
                  onPageChange={setPage}
                  onLimitChange={(newLimit) => {
                    setLimit(newLimit);
                    setPage(1);
                  }}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* ── Vehicle Detail Modal ─────────────────────────────────────────────── */}
      <VehicleDetailModal
        vehicle={selectedVehicle}
        included={vehicleData?.included}
        open={!!selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
      />
    </div>
  );
};

export default Dashboard;
