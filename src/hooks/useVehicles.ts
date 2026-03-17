import { useQuery } from '@tanstack/react-query';
import { mbtaApi } from '../api/axiosInstance';
import { JsonApiResponse, Vehicle } from '../types/mbta';

interface UseVehiclesParams {
  page: number;
  limit: number;
  routeIds?: string[];
  tripIds?: string[];
}

const fetchVehicles = async ({ page, limit, routeIds, tripIds }: UseVehiclesParams): Promise<JsonApiResponse<Vehicle[]>> => {
  const offset = (page - 1) * limit;
  const params: Record<string, string | number> = {
    'page[offset]': offset,
    'page[limit]': limit,
    include: 'route,trip',
  };

  // Multiple selection pada filter didukung dengan comma-separated string `A,B,C`
  if (routeIds && routeIds.length > 0) {
    params['filter[route]'] = routeIds.join(',');
  }

  if (tripIds && tripIds.length > 0) {
    params['filter[trip]'] = tripIds.join(',');
  }



  const { data } = await mbtaApi.get<JsonApiResponse<Vehicle[]>>('/vehicles', { params });
  return data;
};

export const useVehicles = (params: UseVehiclesParams) => {
  return useQuery({
    queryKey: ['vehicles', params],
    queryFn: () => fetchVehicles(params),
    refetchInterval: 15000,
    placeholderData: (previousData) => previousData,
  });
};
