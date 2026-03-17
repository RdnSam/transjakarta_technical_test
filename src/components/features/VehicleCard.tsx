import * as React from "react";
import { MapPin, Clock, Navigation, Tag } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Vehicle } from "@/types/mbta";

interface VehicleCardProps {
  vehicle: Vehicle;
  onClick?: (vehicle: Vehicle) => void;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  IN_TRANSIT_TO: {
    label: "Dalam Perjalanan",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  STOPPED_AT: {
    label: "Berhenti",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  INCOMING_AT: {
    label: "Akan Tiba",
    className: "bg-green-100 text-green-700 border-green-200",
  },
};

const getStatusConfig = (status: string) =>
  statusConfig[status] ?? {
    label: status,
    className: "bg-gray-100 text-gray-600 border-gray-200",
  };

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  onClick,
}) => {
  const { attributes } = vehicle;
  const status = getStatusConfig(attributes.current_status);

  const lastUpdated = attributes.updated_at
    ? formatDistanceToNow(new Date(attributes.updated_at), {
      addSuffix: true,
      locale: id,
    })
    : "—";

  return (
    <Card
      className={cn(
        "group relative flex flex-col overflow-hidden transition-all duration-200",
        "hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/40",
        "cursor-pointer border bg-card"
      )}
      onClick={() => onClick?.(vehicle)}
    >
      {/* Status accent bar di bagian atas card */}
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-1 transition-all duration-200",
          attributes.current_status === "IN_TRANSIT_TO" && "bg-blue-500",
          attributes.current_status === "STOPPED_AT" && "bg-amber-500",
          attributes.current_status === "INCOMING_AT" && "bg-green-500",
          !statusConfig[attributes.current_status] && "bg-gray-400"
        )}
      />

      <CardHeader className="pt-5 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
            <CardTitle className="text-base font-semibold leading-tight">
              {attributes.label ?? vehicle.id}
            </CardTitle>
          </div>
          <Badge
            variant="outline"
            className={cn("text-xs shrink-0 font-medium", status.className)}
          >
            {status.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-2 pb-3">
        {/* Koordinat */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="font-mono text-xs">
            {attributes.latitude.toFixed(5)}, {attributes.longitude.toFixed(5)}
          </span>
        </div>

        {/* Kecepatan */}
        {attributes.speed != null && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Navigation className="h-3.5 w-3.5 shrink-0" />
            <span className="text-xs">{attributes.speed} km/h</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t pt-2 pb-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Diperbarui {lastUpdated}</span>
        </div>
      </CardFooter>
    </Card>
  );
};

/** Skeleton placeholder saat loading */
export const VehicleCardSkeleton: React.FC = () => (
  <Card className="flex flex-col overflow-hidden border">
    <div className="absolute inset-x-0 top-0 h-1 bg-muted animate-pulse" />
    <CardHeader className="pt-5 pb-2">
      <div className="flex items-start justify-between gap-2">
        <div className="h-4 w-28 rounded bg-muted animate-pulse" />
        <div className="h-5 w-20 rounded bg-muted animate-pulse" />
      </div>
    </CardHeader>
    <CardContent className="flex-1 space-y-2 pb-3">
      <div className="h-3 w-40 rounded bg-muted animate-pulse" />
      <div className="h-3 w-24 rounded bg-muted animate-pulse" />
    </CardContent>
    <CardFooter className="border-t pt-2 pb-3">
      <div className="h-3 w-32 rounded bg-muted animate-pulse" />
    </CardFooter>
  </Card>
);
