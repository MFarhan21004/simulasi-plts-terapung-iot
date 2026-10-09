# Simulasi PLTS Terapung + Baterai + Hidrogen Hijau (IoT)

LKM-3 MSTR Energi — Praktek Rekayasa | Kelompok 1

Repositori ini berisi dua versi simulasi:

| Folder | Versi | Teknologi | Keterangan |
|---|---|---|---|
| [`dashboard-react/`](dashboard-react/) | **Baru** | React + TypeScript + Vite + Tailwind | Digital twin 2.5D, satu halaman |
| [`old-vanilla/`](old-vanilla/) | Lama | HTML + CSS + Canvas 2D | Versi sesuai syarat README tugas (tanpa framework) |

Kedua versi memakai rumus fisika yang sama (LKM-3).

## Menjalankan versi baru (React)

```bash
cd dashboard-react
npm install
npm run dev      # buka http://localhost:5173
npm run build    # build produksi ke dist/
npm run check    # uji mesin simulasi
```

## Menjalankan versi lama (vanilla)

```bash
cd old-vanilla
python3 -m http.server 8000   # buka http://localhost:8000
```

Atau buka `old-vanilla/index.html` langsung di browser.
Spesifikasi lengkapnya ada di `old-vanilla/README_FINAL_ANTIGRAVITY.md`.
