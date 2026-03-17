import { useInfiniteQuery } from '@tanstack/react-query';
import { mbtaApi } from '../api/axiosInstance';
import { JsonApiResponse, Route, Trip } from '../types/mbta';

const LIMIT = 20;

const fetchRoutes = async ({ pageParam = 0 }): Promise<JsonApiResponse<Route[]>> => {
  const { data } = await mbtaApi.get<JsonApiResponse<Route[]>>('/routes', {
    params: {
      'page[offset]': pageParam,
      'page[limit]': LIMIT,
    },
  });
  return data;
};

export const useInfiniteRoutes = () => {
  return useInfiniteQuery({
    queryKey: ['routes', 'infinite'],
    queryFn: fetchRoutes,
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // Jika data yang dikembalikan lebih kecil dari limit, artinya kita sdh di halaman terakhir
      if (lastPage.data.length < LIMIT) {
        return undefined;
      }
      return allPages.length * LIMIT; // Hitung offset berikutnya
    },
  });
};

// --- REFACTORED: Ambil Trip aktif langsung dari kendaraan ------------------
// Kenapa? Karena /trips di MBTA menampilkan SELURUH jadwal yang per harinya bisa ribuan.
// Sebagian besar adalah trip yang sudah lewat/kedaluwarsa (misal ID 7384...).
// Untuk dashboard Real-time armada, kita butuh "Trip yang SEDANG ADA KENDARAANNYA sekarang" (ID 749...).
const fetchActiveTripsFromVehicles = async ({ 
  selectedRoutes = [] as string[]
}): Promise<JsonApiResponse<Trip[]>> => {
  const { data } = await mbtaApi.get<JsonApiResponse<any>>('/vehicles', {
    params: {
      'page[limit]': 100, // Ambil max 100 kendaraan yang beroperasi per rute ini
      include: 'trip',
      ...(selectedRoutes.length > 0 && {
        'filter[route]': selectedRoutes.join(','),
      }),
    },
  });

  // Ekstrak info Trip dari array `included` bawaan MBTA
  const activeTrips = (data.included || [])
    .filter((item) => item.type === 'trip') as unknown as Trip[];

  // Cegah duplikasi (jika 1 trip dipakai bertumpuk)
  const uniqueTrips = Array.from(new Map(activeTrips.map(t => [t.id, t])).values());

  return { data: uniqueTrips };
};

export const useInfiniteTrips = (selectedRoutes: string[] = []) => {
  return useInfiniteQuery({
    queryKey: ['trips', 'active', selectedRoutes],
    queryFn: () => fetchActiveTripsFromVehicles({ selectedRoutes }),
    initialPageParam: 0,
    getNextPageParam: () => undefined, // Tidak perlu infinite scroll lagi, karena hasil sudah difilter spesifik <100 item real
    enabled: selectedRoutes.length > 0, // ← tetap skip fetch kalau belum pilih route
  });
};
