TJ Fleet Management

Aplikasi pemantauan armada angkutan umum *(Fleet Management)* secara riil (Real-time). Dibuat dengan tampila simple modren dengan beberapa component shadcn/ui untuk memudahkan admin memonitor posisi dan status armada dari MBTA API.

Fitur Utama
* **Live Vehicle Tracking**: Pantau lokasi armada ("Melaju", "Berhenti", "Akan Tiba") langsung di layar.
* **Smart Filter**: Saring kendaraan berdasarkan rute (Jalur) atau trip spesifik yang **sedang aktif** saat ini.
* **Peta Interaktif**: Klik pada armada mana saja untuk melihat posisinya di atas **Google Maps**.
* **Premium UI**: Desain mewah dan bersih dengan sentuhan animasi dan efek transparan (Glassmorphism).

Stack Teknologi
* **Frontend**: React 18, TypeScript, Vite
* **State & Data**: TanStack Query v5, Axios
* **UI & Styling**: Tailwind CSS, shadcn/ui, Framer Motion
* **Maps**: Google Maps API (@vis.gl/react-google-maps)

Penjelasan Arsitektur
* **Modular Client-Side SPA**: Aplikasi berjalan utuh di sisi klien. Perubahan di layar terasa instan tanpa reload.
* **Smart Data Fetching (`src/hooks`)**: Menggunakan `TanStack Query` untuk request API agar tidak duplikat, dilengkapi fitur *Auto-Refresh* berkala dan Caching cerdas.
* **Live Trip Filtering**: Alih-alih meload semua jadwal (yang jumlahnya bisa ribuan per hari), API dibajak untuk hanya memunculkan daftar Trip yang *benar-benar sedang ada di jalan saat ini*.

---

#Untuk menjalankan applikasi
Clone, Masuk ke directory proyek, lalu install dependensi. buka terminal "yarn install"

Setup Environment Variable
Buat file bernama `.env` di folder utama aplikasi (Sejajar dengan `package.json`). Isi 2 kunci API wajib berikut ini:
```env
VITE_MBTA_API_KEY="isi_dengan_mbta_api_key"
VITE_GOOGLE_MAPS_API_KEY="isi_dengan_google_maps_api_key_anda"
```

Mulai Server (Dev Mode)
Jalankan perintah ini:
yarn dev

Buka browser dan masuk ke **http://localhost:5173/**. Selesai!
