import * as React from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
} from "@vis.gl/react-google-maps";
import { formatDistanceToNow } from "date-fns";
import { id as localId } from "date-fns/locale";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Clock,
  Tag,
  Route as RouteIcon,
  Navigation,
  Activity,
  ChevronRight,
  ExternalLink,
  ArrowUp,
  Users,
  Info,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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

// ── Occupancy Helper ────────────────────────────────────────────────────────
const OccupancyIndicator: React.FC<{ status: string | null }> = ({ status }) => {
  if (!status) return null;

  const levels: Record<string, number> = {
    MANY_SEATS_AVAILABLE: 1,
    FEW_SEATS_AVAILABLE: 2,
    STANDING_ROOM_ONLY: 3,
    CRUSH_CAPACITY: 4,
    FULL: 5,
  };

  const currentLevel = levels[status] || 0;
  const label = status.replace(/_/g, " ").toLowerCase();

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((lvl) => (
          <Users
            key={lvl}
            className={`h-3.5 w-3.5 ${lvl <= currentLevel ? "text-primary fill-primary" : "text-muted-foreground/30"
              }`}
          />
        ))}
      </div>
      <span className="text-xs font-medium capitalize text-muted-foreground">{label}</span>
    </div>
  );
};

// ── Bearing Helper ─────────────────────────────────────────────────────────
const getCardinalDirection = (bearing: number | null) => {
  if (bearing === null) return "—";
  const directions = ["Uara", "Timur Laut", "Timur", "Tenggara", "Selatan", "Barat Daya", "Barat", "Barat Laut"];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
};

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
  const { theme, resolvedTheme } = useTheme();

  if (!vehicle) return null;

  const currentTheme = (resolvedTheme || theme || "light") as "light" | "dark";
  const { attributes, relationships } = vehicle;

  const routeId = relationships?.route?.data?.id;
  const tripId = relationships?.trip?.data?.id;
  const routeData = findIncluded(included, "route", routeId) as MbtaRoute | undefined;
  const tripData = findIncluded(included, "trip", tripId) as Trip | undefined;

  const status = getStatus(attributes.current_status);
  const lastUpdated = attributes.updated_at
    ? formatDistanceToNow(new Date(attributes.updated_at), { addSuffix: true, locale: localId })
    : null;

  const position = { lat: attributes.latitude, lng: attributes.longitude };
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${attributes.latitude},${attributes.longitude}`;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl w-[95vw] max-h-[92vh] p-0 overflow-y-auto border-none bg-background/95 backdrop-blur-xl gap-0">
        <DialogHeader className="px-5 pt-5 pb-4 bg-gradient-to-b from-primary/5 to-transparent sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b">
          <div className="flex items-center justify-between gap-4 mr-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-4 ring-primary/5">
                <Navigation className="h-5 w-5" style={{ transform: `rotate(${attributes.bearing ?? 0}deg)` }} />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight truncate">
                  Unit {attributes.label ?? vehicle.id}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">
                    Live • {lastUpdated}
                  </p>
                </div>
              </div>
            </div>
            <Badge variant={status.variant} className="hidden xs:flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
              {status.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1">
          {/* ── Google Map ────────────────────────────────────────────────── */}
          <div className="h-56 sm:h-72 w-full bg-muted shadow-inner overflow-hidden border-b border-border/50">
            {GOOGLE_MAPS_API_KEY ? (
              <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
                <Map
                  mapId={currentTheme === "dark" ? "dark-fleet-map" : "light-fleet-map"}
                  colorScheme={currentTheme.toUpperCase() as "LIGHT" | "DARK"}
                  defaultCenter={position}
                  defaultZoom={15}
                  gestureHandling="greedy"
                  disableDefaultUI={false}
                  style={{ width: "100%", height: "100%" }}
                >
                  <AdvancedMarker position={position} title={attributes.label ?? vehicle.id}>
                    <Pin
                      background={currentTheme === "dark" ? "#3b82f6" : "#1d4ed8"}
                      borderColor={currentTheme === "dark" ? "#2563eb" : "#1e40af"}
                      glyphColor="#ffffff"
                    />
                  </AdvancedMarker>
                </Map>
              </APIProvider>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <MapPin className="h-10 w-10 opacity-20" />
                <p className="text-sm font-medium">Peta belum dikonfigurasi</p>
              </div>
            )}
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="px-5 py-6 space-y-4"
          >
            {/* Mobile-only status badge */}
            <div className="flex xs:hidden">
              <Badge variant={status.variant} className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                {status.label}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Info Utama */}
              <Card className="p-4 border-muted/50 bg-muted/20 shadow-none space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <Info className="h-4 w-4" />
                  <h3 className="text-[10px] font-bold uppercase tracking-widest">Detail Perjalanan</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-start border-b border-border/40 pb-2">
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">Layanan Rute</span>
                    <span className="text-xs sm:text-sm font-bold text-right max-w-[150px]">
                      {routeData ? (routeData as MbtaRoute).attributes.long_name : routeId}
                    </span>
                  </div>
                  <div className="flex justify-between items-start border-b border-border/40 pb-2">
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">Tujuan Final</span>
                    <span className="text-xs sm:text-sm font-bold text-right max-w-[150px]">
                      {tripData ? (tripData as Trip).attributes.headsign : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">ID Armada</span>
                    <span className="text-[10px] font-mono bg-muted-foreground/10 px-1.5 py-0.5 rounded">{vehicle.id}</span>
                  </div>
                </div>
              </Card>

              {/* Statistik & Kondisi */}
              <Card className="p-4 border-muted/50 bg-muted/20 shadow-none space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <Activity className="h-4 w-4" />
                  <h3 className="text-[10px] font-bold uppercase tracking-widest">Kondisi & Lokasi</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tight">Arah Hadap</p>
                      <div className="flex items-center gap-1.5">
                        <ArrowUp className="h-3 w-3 text-primary" style={{ transform: `rotate(${attributes.bearing ?? 0}deg)` }} />
                        <span className="text-xs sm:text-sm font-bold">{getCardinalDirection(attributes.bearing)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tight">Kecepatan</p>
                      <p className="text-xs sm:text-sm font-bold">{attributes.speed ? `${attributes.speed} km/h` : "0 km/h"}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tight">Kapasitas Penumpang</p>
                    <OccupancyIndicator status={attributes.occupancy_status} />
                  </div>
                </div>
              </Card>
            </div>

            <Button size="sm" variant="outline" className="w-full shadow-sm rounded-lg h-10 px-4 group gap-2 border bg-background/50 backdrop-blur" asChild>
              <a href={googleMapsUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4 transition-transform group-hover:scale-110" />
                <span className="font-bold text-xs uppercase tracking-wide">Lihat di Google Maps</span>
              </a>
            </Button>
          </motion.div>
        </div>

        <div className="px-5 py-4 bg-muted/30 border-t border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
              MBTA Realtime Service
            </span>
          </div>
          <p className="text-[10px] font-mono text-muted-foreground/60">{position.lat.toFixed(5)}, {position.lng.toFixed(5)}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

