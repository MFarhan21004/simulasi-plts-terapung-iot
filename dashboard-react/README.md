# Dashboard PLTS Terapung + Baterai + H₂ Hijau

Versi **React** dari simulasi LKM-3 MSTR Energi, dibangun sebagai *industrial
renewable energy digital twin dashboard*.

> Catatan: versi **vanilla** (HTML + CSS + Canvas 2D) ada di folder `../old-vanilla/`
> repositori ini. Itulah versi yang memenuhi batasan README tugas, yang melarang
> framework dan library eksternal. Folder ini adalah versi tambahan.

## Menjalankan

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # build produksi ke dist/
npm run check    # uji mesin simulasi (26 pemeriksaan)
```

## Teknologi

React 19 · TypeScript · Vite · Tailwind CSS v4 · Lucide React · Recharts ·
Framer Motion. Diagram aliran energi memakai SVG, bukan canvas.

## Struktur

```
src/
├─ types/simulation.ts        Tipe bersama (state, kontrol, relay, aliran)
├─ utils/
│  ├─ constants.ts            Parameter fisik LKM-3 + ambang EMS
│  ├─ physics.ts              Mesin simulasi murni (satu langkah = satu fungsi)
│  └─ format.ts               Pemformat satuan (W, V, A, mL, Wh)
├─ data/scenarios.ts          Enam skenario bawaan
├─ hooks/useSimulation.ts     Loop realtime + riwayat grafik
└─ components/
   ├─ ui.tsx                  Primitif: Card, Metric, SliderRow, PowerToggle…
   ├─ Header.tsx              Navigasi, jam simulasi, Jeda/Reset
   ├─ ControlSidebar.tsx      Panel kontrol kanan
   ├─ BottomPanels.tsx        Metrik, donat energi, penyimpanan, status, grafik
   └─ diagram/
      ├─ layout.ts            Geometri node + jalur kabel (ruang desain 1200×640)
      ├─ nodes.tsx            Kartu tiap komponen fisik
      └─ EnergyDiagram.tsx    Lapisan SVG aliran energi + penempatan kartu
```

Mesin simulasi (`utils/physics.ts`) murni: menerima keadaan lama dan
mengembalikan keadaan baru. Tidak menyentuh DOM, jadi bisa diuji langsung
lewat `npm run check` tanpa merender apa pun.

## Model fisika

Rumus diambil dari LKM-3, sama persis dengan versi vanilla:

| Besaran | Persamaan |
|---|---|
| Iradiansi | `G = G_max · s · T_awan` |
| Suhu sel | `T_sel = T_amb + ((NOCT − 20)/800) · G` |
| Daya panel | `P_pv = P_stc · (G/1000) · PR · [1 − γ(T_sel − 25)]` |
| Baterai | `dE/dt = η_chg·P_net` (isi) atau `P_net/η_dis` (kosong) |
| Tegangan baterai | `V_bat = V_oc(SOC) + I_bat · R_int` |
| Elektrolisis | `n_H₂ = η_F · I · t / (2F)` → `V_H₂ = n · V_m`, `V_O₂ = V_H₂/2` |
| Fuel cell | `P_fc = P_beban · η_fc` |

Tetapan: `P_stc = 5 W`, `PR = 0,8`, `γ = 0,004/°C`, `NOCT = 45 °C`,
baterai `3,7 V × 5,2 Ah ≈ 19,24 Wh`, `η_chg = 0,85`, `η_dis = 0,90`,
`R_int = 0,15 Ω`, elektroliser `2,0 V`, `η_fc = 0,50`, `P_ESP = 0,4 W`.

## EMS

Dua versi dapat dipilih saat berjalan:

- **v2 (bawaan)** — histeresis + tundaan defisit 5 detik, dan memeriksa stok H₂
  sebelum menyalakan fuel cell. Peralihan stabil.
- **v1 (pembanding)** — ambang tunggal tanpa tundaan. Sengaja dipertahankan
  untuk memperlihatkan relay yang berdetak di sekitar ambang.

Kaskade sumber beban saat defisit: **baterai → fuel cell (CH3) → PLN (CH4)**.
PLN hanya menyala bila stok H₂ benar-benar habis.
