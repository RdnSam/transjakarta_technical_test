export interface JsonApiLinks {
  self?: string;
  next?: string;
  prev?: string;
  first?: string;
  last?: string;
}

export interface JsonApiMeta {
  pagination?: {
    limit?: number;
    offset?: number;
    total?: number;
  };
}

export interface JsonApiData<TAttributes, TRelationships = Record<string, { data: { id: string; type: string } | null }>> {
  id: string;
  type: string;
  attributes: TAttributes;
  relationships?: TRelationships;
  links?: JsonApiLinks;
}

export interface JsonApiResponse<TData, TIncluded = Record<string, unknown>> {
  data: TData;
  included?: TIncluded[];
  links?: JsonApiLinks;
  meta?: JsonApiMeta;
}

export interface VehicleAttributes {
  bearing: number | null;
  car_seats_available: number | null;
  current_status: "IN_TRANSIT_TO" | "INCOMING_AT" | "STOPPED_AT" | string;
  current_stop_sequence: number | null;
  direction_id: number | null;
  label: string | null;
  latitude: number;
  longitude: number;
  occupancy_status: string | null;
  revenue: string | null;
  speed: number | null;
  updated_at: string;
}

export interface VehicleRelationships {
  route?: { data?: { id: string; type: string } };
  stop?: { data?: { id: string; type: string } };
  trip?: { data?: { id: string; type: string } };
}

export type Vehicle = JsonApiData<VehicleAttributes, Record<string, { data: { id: string; type: string } | null }>>;

export interface RouteAttributes {
  color: string;
  description: string;
  direction_destinations: string[];
  direction_names: string[];
  fare_class: string;
  long_name: string;
  short_name: string;
  sort_order: number;
  text_color: string;
  type: number;
}

export type Route = JsonApiData<RouteAttributes>;

export interface TripAttributes {
  bikes_allowed: number;
  block_id: string;
  direction_id: number;
  headsign: string;
  name: string;
  wheelchair_accessible: number;
}

export type Trip = JsonApiData<TripAttributes>;
