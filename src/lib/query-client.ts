import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Jangan auto-refetch kalau ganti tab
      retry: 2, // Default retry kalau gagal fetch
      staleTime: 5 * 60 * 1000, // Caching default 5 menit (bisa di-override per query)
    },
  },
});
