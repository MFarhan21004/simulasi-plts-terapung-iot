# Simulasi PLTS Terapung + Baterai + Hidrogen Hijau (IoT)

Aplikasi simulasi interaktif berbasis web (HTML5 Canvas + Vanilla JS) untuk memodelkan sistem pembangkit listrik tenaga surya terapung (Floating PV) yang terintegrasi dengan baterai penyimpanan (BESS) dan sistem produksi hidrogen hijau (Water Electrolyzer & Fuel Cell) dengan monitoring berbasis IoT.

---

## 🌟 Fitur Utama

1. **Simulasi Dinamis Cuaca Real-time**:
   - Kontrol posisi matahari & iradiansi surya ($W/m^2$).
   - Kecepatan angin ($m/s$) dan suhu lingkungan ($^\circ C$).
   - Awan dinamis interaktif (dapat digeser untuk menutupi panel dan mengurangi iradiansi).

2. **Model Fisika Akurat**:
   - **Floating PV**: Efek pendinginan air (water cooling) meningkatkan efisiensi modul surya.
   - **Baterai (BESS)**: Kapasitas 200 kWh, perhitungan DoD (Depth of Discharge), efisiensi charge/discharge.
   - **Hidrogen Hijau**: Elektrolisis air saat surplus energi, Fuel Cell aktif saat defisit kritis.

3. **EMS (Energy Management System)**:
   - Manajemen aliran daya otomatis antar komponen.
   - Logika prioritas beban, pengisian baterai, dan produksi hidrogen.

4. **Visualisasi Interaktif (Canvas 2D)**:
   - Animasi partikel aliran arus listrik & gas hidrogen.
   - Efek gelombang air dan refleksi dinamis.
   - Efek visual siang, sore, dan malam hari.

5. **Panel Monitoring IoT & Grafik Interaktif**:
   - Dashboard telemetry real-time (tegangan, arus, daya, SoC, level tangki $H_2$).
   - Grafik histori daya (PV vs Beban vs Baterai).
   - Kontrol skenario cepat: *Siang Cerah*, *Malam Hari Defisit*, *Cuaca Berawan*, dll.

---

## 🚀 Cara Menjalankan

Cukup jalankan lokal server di direktori project:

```bash
# Menggunakan Python
python -m http.server 8000

# Atau buka index.html langsung di web browser favorit Anda
```

Buka browser dan akses: `http://localhost:8000`

---

## 📁 Struktur Direktori

```text
├── index.html                  # Halaman utama aplikasi simulasi
├── css/
│   └── style.css               # Styling tema modern dark glassmorphism
├── js/
│   ├── config.js               # Parameter konfigurasi sistem fisik & IoT
│   ├── weather.js              # Model lingkungan, matahari, dan awan
│   ├── physics.js              # Formula fisika PV, Baterai, Elektroliser, Fuel Cell
│   ├── ems.js                  # Energy Management System logika kontrol daya
│   ├── particles.js            # Sistem partikel aliran energi & gas
│   ├── renderer.js             # Canvas rendering (lanskap, panel, komponen, efek)
│   ├── ui.js                   # Interaksi UI, event listener slider & tombol
│   └── main.js                 # Loop simulasi utama & telemetry ticker
└── README_FINAL_ANTIGRAVITY.md # Panduan komprehensif & arsitektur teknis
```
