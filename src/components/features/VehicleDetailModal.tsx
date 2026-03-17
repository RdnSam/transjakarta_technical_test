import * as React from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
} from "@vis.gl/react-google-maps";
import { formatDistanceToNow } from "date-fns";
import { id as localId } from "date-fns/locale";
import {
  MapPin,
  Clock,
  Tag,
  Route,
  Navigation,
  Activity,
  ChevronRight,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { Vehicle, Route as MbtaRoute, Trip } from "@/types/mbta";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

// ── Status Config ───────────────────────────────────────────────────────────
const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  IN_TRANSIT_TO: { label: "Dalam Perjalanan", variant: "default" },
  STOPPED_AT: { label: "Berhenti", variant: "secondary" },
  INCOMING_AT: { label: "Akan Tiba", variant: "outline" },
};

const getStatus = (s: string) =>
  statusConfig[s] ?? { label: s, variant: "outline" as const };

// ── Tipe untuk `included` dari JSON:API ────────────────────────────────────
type IncludedItem = MbtaRoute | Trip | { id: string; type: string; attributes: Record<string, unknown> } | Record<string, unknown>;

// ── Helper ─────────────────────────────────────────────────────────────────
const findIncluded = (
  included: IncludedItem[] | undefined,
  type: string,
  id: string | undefined
): IncludedItem | undefined => {
  if (!included || !id) return undefined;
  return included.find((item) => item.type === type && item.id === id);
};

// ── Info Row ───────────────────────────────────────────────────────────────
const InfoRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5 text-muted-foreground">{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p className="text-sm font-medium text-foreground break-words">
        {value ?? <span className="text-muted-foreground italic">Tidak tersedia</span>}
      </p>
    </div>
  </div>
);

// ── Main Component ──────────────────────────────────────────────────────────
interface VehicleDetailModalProps {
  vehicle: Vehicle | null;
  included?: IncludedItem[];
  open: boolean;
  onClose: () => void;
}

export const VehicleDetailModal: React.FC<VehicleDetailModalProps> = ({
  vehicle,
  included,
  open,
  onClose,
}) => {
  if (!vehicle) return null;

  const { attributes, relationships } = vehicle;

  // Ambil relasi Route & Trip dari included array
  const routeId = relationships?.route?.data?.id;
  const tripId = relationships?.trip?.data?.id;

  const routeData = findIncluded(included, "route", routeId) as MbtaRoute | undefined;
  const tripData = findIncluded(included, "trip", tripId) as Trip | undefined;

  const status = getStatus(attributes.current_status);
  const lastUpdated = attributes.updated_at
    ? formatDistanceToNow(new Date(attributes.updated_at), {
        addSuffix: true,
        locale: localId,
      })
    : null;

  const position = { lat: attributes.latitude, lng: attributes.longitude };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-0">
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Tag className="h-5 w-5 text-muted-foreground" />
              Kendaraan: {attributes.label ?? vehicle.id}
            </DialogTitle>
            <Badge variant={status.variant} className="shrink-0">
              {status.label}
            </Badge>
          </div>
        </DialogHeader>

        {/* ── Google Map ────────────────────────────────────────────────── */}
        <div className="h-64 w-full bg-muted">
          {GOOGLE_MAPS_API_KEY ? (
            <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
              <Map
                mapId="vehicle-detail-map"
                defaultCenter={position}
                defaultZoom={15}
                gestureHandling="greedy"
                disableDefaultUI={false}
                style={{ width: "100%", height: "100%" }}
              >
                <AdvancedMarker position={position} title={attributes.label ?? vehicle.id}>
                  <Pin
                    background="#1d4ed8"
                    borderColor="#1e40af"
                    glyphColor="#ffffff"
                  />
                </AdvancedMarker>
              </Map>
            </APIProvider>
          ) : (
            // Fallback jika API key tidak tersedia
            <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <MapPin className="h-8 w-8" />
              <p className="text-sm">Peta tidak tersedia (API Key diperlukan)</p>
              <p className="text-xs font-mono">
                {attributes.latitude.toFixed(6)}, {attributes.longitude.toFixed(6)}
              </p>
            </div>
          )}
        </div>

        {/* ── Detail Info ────────────────────────────────────────────────── */}
        <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Kolom Kiri */}
          <div className="space-y-4">
            <InfoRow
              icon={<Tag className="h-4 w-4" />}
              label="Label Kendaraan"
              value={attributes.label ?? vehicle.id}
            />
            <InfoRow
              icon={<Activity className="h-4 w-4" />}
              label="Status"
              value={status.label}
            />
            <InfoRow
              icon={<MapPin className="h-4 w-4" />}
              label="Koordinat"
              value={`${attributes.latitude.toFixed(6)}, ${attributes.longitude.toFixed(6)}`}
            />
            {attributes.speed != null && (
              <InfoRow
                icon={<Navigation className="h-4 w-4" />}
                label="Kecepatan"
                value={`${attributes.speed} km/h`}
              />
            )}
          </div>

          {/* Kolom Kanan */}
          <div className="space-y-4">
            <InfoRow
              icon={<Clock className="h-4 w-4" />}
              label="Terakhir Diperbarui"
              value={lastUpdated ?? "—"}
            />
            <InfoRow
              icon={<Route className="h-4 w-4" />}
              label="Rute"
              value={
                routeData
                  ? (routeData as MbtaRoute).attributes.long_name ||
                    (routeData as MbtaRoute).attributes.short_name ||
                    routeId
                  : routeId
              }
            />
            <InfoRow
              icon={<ChevronRight className="h-4 w-4" />}
              label="Trip / Headsign"
              value={
                tripData
                  ? (tripData as Trip).attributes.headsign ||
                    (tripData as Trip).attributes.name ||
                    tripId
                  : tripId
              }
            />
            {attributes.occupancy_status && (
              <InfoRow
                icon={<Activity className="h-4 w-4" />}
                label="Kapasitas Penumpang"
                value={attributes.occupancy_status.replace(/_/g, " ")}
              />
            )}
          </div>
        </div>

        <Separator />
        <p className="px-6 py-3 text-xs text-muted-foreground">
          ID Kendaraan: <span className="font-mono">{vehicle.id}</span>
        </p>
      </DialogContent>
    </Dialog>
  );
};
