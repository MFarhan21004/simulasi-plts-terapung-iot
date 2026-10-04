# Simulasi Interaktif PLTS Terapung + Baterai + Hidrogen Hijau (IoT)

Simulasi web bergaya **PhET Interactive Simulations (University of Colorado Boulder)** untuk memvisualisasikan prototipe *Smart Renewable Energy System* dari tugas **LKM-3 MSTR Energi (Praktek Rekayasa)**. Dibangun dengan **HTML5 Canvas, CSS, dan JavaScript murni** (tanpa framework, tanpa *build step*).

Pengguna dapat mengatur **intensitas cahaya matahari** dan **menggerakkan awan** yang menutup atau membuka panel surya, lalu mengamati bagaimana energi mengalir: panel → baterai → lampu → elektroliser (H₂) → *fuel cell*, lengkap dengan angka perhitungan energinya.

---

## Daftar Isi

1. [Latar Belakang](#1-latar-belakang)
2. [Tujuan dan Ruang Lingkup](#2-tujuan-dan-ruang-lingkup)
3. [Fitur Utama](#3-fitur-utama)
4. [Tata Letak Tampilan](#4-tata-letak-tampilan)
5. [Daftar Komponen (12 Objek)](#5-daftar-komponen-12-objek)
6. [Model Fisika dan Perhitungan](#6-model-fisika-dan-perhitungan)
7. [Mekanisme Awan](#7-mekanisme-awan)
8. [Visualisasi Aliran Energi](#8-visualisasi-aliran-energi)
9. [Arsitektur Kode dan Struktur Folder](#9-arsitektur-kode-dan-struktur-folder)
10. [Alur Simulasi (*Game Loop*)](#10-alur-simulasi-game-loop)
11. [Spesifikasi Panel Kontrol](#11-spesifikasi-panel-kontrol)
12. [Skenario Bawaan (*Preset*)](#12-skenario-bawaan-preset)
13. [Cara Menjalankan](#13-cara-menjalankan)
14. [Skenario Uji dan Kriteria Penerimaan](#14-skenario-uji-dan-kriteria-penerimaan)
15. [Keterbatasan Model](#15-keterbatasan-model)
16. [Peta Jalan Pengembangan](#16-peta-jalan-pengembangan)
17. [Referensi](#17-referensi)

---

## IMPLEMENTATION INSTRUCTION FOR ANTIGRAVITY / VIBE CODING

Bagian ini adalah instruksi implementasi langsung untuk AI coding seperti Antigravity atau Vibe Coding. README ini harus diperlakukan sebagai **spesifikasi proyek utama**. AI coding harus membangun aplikasi yang benar-benar berjalan, bukan hanya membuat mockup visual.

### Aturan Implementasi

1. **Bangun seluruh project dari README ini** dan implementasikan semua fitur yang dijelaskan pada bagian berikutnya.
2. Gunakan **HTML5 Canvas 2D + CSS + JavaScript murni (Vanilla JavaScript)**.
3. **Jangan menggunakan React, Vue, Angular, TypeScript, atau framework/build tool lain**.
4. **Jangan bergantung pada CDN atau library eksternal** kecuali secara eksplisit diminta kemudian. Project harus dapat berjalan secara lokal tanpa instalasi package tambahan.
5. Buat seluruh struktur folder dan file yang tercantum pada Bagian 9.
6. Semua 12 objek utama harus benar-benar digambar dan tampil di Canvas, bukan berupa kotak placeholder.
7. Semua slider, tombol, saklar, pilihan EMS, preset, dan kontrol yang disebutkan harus **benar-benar berfungsi dan memengaruhi state simulasi**.
8. Implementasikan persamaan fisika, model baterai, elektroliser, fuel cell, EMS v1/v2, mekanisme awan, aliran energi, dan partikel sesuai spesifikasi README ini. Jangan mengganti parameter atau rumus tanpa alasan yang ditulis jelas di kode.
9. Pisahkan **model fisika, EMS, cuaca, renderer, partikel, dan UI** sesuai arsitektur pada Bagian 9. Hindari mencampur logika fisika dengan kode gambar Canvas.
10. Gunakan satu objek `state` sebagai sumber keadaan utama simulasi, sesuai contoh pada Bagian 9.
11. Canvas menggunakan resolusi logis **1200 × 675 (16:9 landscape)** dan harus diskalakan secara responsif. Target tampilan desktop dapat mencapai **1920 × 1080** tanpa mengubah rasio 16:9.
12. Pada layar kecil, layout harus tetap responsif sesuai ketentuan pada Bagian 4 dan Bagian 11.
13. Gunakan gambar/aset eksternal hanya jika benar-benar diperlukan. **Komponen utama sebaiknya dibuat dengan Canvas/SVG/CSS** agar mudah dianimasikan dan tidak bergantung pada aset PNG. Folder `assets/` bersifat opsional.
14. Jika aset visual digunakan, gunakan aset yang bebas digunakan/berlisensi sesuai dan simpan secara lokal di folder `assets/`; jangan membuat ketergantungan pada URL gambar eksternal.
15. Implementasikan animasi dengan `requestAnimationFrame` dan game loop pada Bagian 10. Batasi `dtReal` dan gunakan sub-langkah simulasi maksimum 1 detik seperti spesifikasi.
16. Pastikan simulasi tidak menghasilkan `NaN`, `Infinity`, atau error JavaScript ketika slider berada pada nilai minimum/maksimum.
17. Pastikan nilai SOC, volume H₂/O₂, dan parameter yang memiliki batas tidak pernah keluar dari rentang fisiknya.
18. Implementasikan pengaman tabung H₂ penuh 50 mL sehingga elektroliser berhenti otomatis.
19. Implementasikan aksesibilitas dasar: kontrol keyboard, `aria-label`, teks status selain indikator warna, dan dukungan `prefers-reduced-motion`.
20. Setelah implementasi selesai, lakukan pengecekan terhadap **T1–T14** pada Bagian 14. Jika ada yang gagal, perbaiki implementasi sebelum menyatakan project selesai.

### Definition of Done untuk AI Coding

Project dianggap selesai hanya jika:

- `index.html` dapat dijalankan dan simulasi tampil tanpa error konsol.
- Canvas tampil dalam **landscape 16:9** dan responsif sampai 1920×1080.
- Semua 12 objek utama terlihat dan saling terhubung secara visual.
- Slider matahari memengaruhi iradiansi dan daya panel.
- Awan dapat bergerak otomatis, diseret, ditutup, dan dibuka; bayangannya memengaruhi daya panel.
- Baterai benar-benar mengisi dan mengosong berdasarkan neraca energi.
- EMS v1 dan v2 menghasilkan perilaku berbeda sesuai spesifikasi.
- Elektroliser menghasilkan H₂/O₂ berdasarkan Hukum Faraday.
- Fuel cell menggunakan stok H₂ dan dapat membantu beban saat defisit.
- Partikel energi bergerak mengikuti arah dan besar aliran daya.
- Dashboard laptop/ponsel menampilkan data simulasi yang berubah secara real time.
- Preset skenario dapat digunakan.
- T1–T14 dapat diuji dan hasilnya berada dalam toleransi yang ditentukan.
- Tidak ada placeholder yang membuat fitur utama terlihat sudah selesai padahal belum berfungsi.

### Cara AI Coding Bekerja

Jika README ini diberikan kepada Antigravity/Vibe Coding, AI **boleh membuat file satu per satu dan melakukan iterasi**, tetapi jangan menghapus atau menyederhanakan requirement utama. Jika ada detail visual yang belum ditentukan, gunakan gaya visual simulasi pendidikan interaktif yang bersih, jelas, dan mudah dibaca, sambil mempertahankan posisi, komponen, parameter, dan logika yang sudah ditentukan README.

---

## 1. Latar Belakang

Proyek ini merupakan kelanjutan dari tiga Lembar Kerja Mahasiswa (LKM) mata kuliah MSTR Energi:

| LKM | Isi | Kontribusi ke simulasi |
|-----|-----|------------------------|
| **LKM-1** | Identifikasi masalah energi Indonesia; solusi: sistem energi terintegrasi (PLTS terapung, *energy storage*, *super grid*, *green hydrogen*) | Menentukan **konsep sistem** yang disimulasikan |
| **LKM-2** | Percobaan PhET *Photoelectric Effect* (Na: 698 nm → 0 A; 455 nm → 0,045 A; 50% → 0,023 A; 100% → 0,045 A) | Menjadi dasar bahwa **arus sebanding intensitas cahaya** setelah ambang terlewati |
| **LKM-3** | Rancangan prototipe IoT: panel 6 V 5 W terapung + baterai Li-ion + ESP32 + elektroliser + *fuel cell* + dasbor | Menjadi **sumber spesifikasi, logika EMS, dan nilai parameter** simulasi |

Simulasi ini menggantikan peran prototipe fisik untuk eksplorasi: pengguna dapat mengubah kondisi cuaca tanpa menunggu matahari, dan melihat perilaku sistem (termasuk kasus *defisit* di malam atau saat mendung) dalam hitungan detik.

---

## 2. Tujuan dan Ruang Lingkup

### Tujuan

1. Membuat simulasi interaktif yang **sebanding dengan gaya PhET**: kontrol langsung, umpan balik visual instan, dan angka yang dapat dibaca.
2. Menunjukkan hubungan **intensitas cahaya → daya panel → pengisian baterai → produksi H₂ → listrik dari *fuel cell***.
3. Memperlihatkan **dampak awan** terhadap daya keluaran dan keputusan *Energy Management System* (EMS).
4. Memvalidasi secara numerik angka-angka pada LKM-3 (misalnya 16 Wh/hari, 3,8 mL H₂/menit).

### Termasuk (*in scope*)

- Satu halaman web statis (`index.html`) dengan satu kanvas utama.
- Model fisika sederhana berbasis persamaan energi (bukan simulasi sirkuit tingkat SPICE).
- EMS dengan histeresis sesuai desain v2 pada LKM-3.
- Panel kontrol dan panel info ringkas di luar kanvas.

### Tidak termasuk (*out of scope*)

- Simulasi mikroskopis efek fotolistrik (sudah dicakup PhET asli pada LKM-2).
- Komunikasi nyata dengan ESP32 (dasbor pada simulasi hanya tampilan ilustratif).
- Kurva I–V panel dan dinamika elektrokimia baterai secara rinci.

---

## 3. Fitur Utama

- **Slider intensitas matahari** (0–100%) yang langsung mengubah iradiansi (W/m²).
- **Awan dinamis**: dapat diseret manual, bergerak otomatis oleh angin, atau digerakkan dengan tombol **Tutup Awan** / **Buka Awan**. Kerapatan dan kecepatan awan dapat diatur.
- **Bayangan awan dihitung dari geometri**: daya panel turun hanya bila awan benar-benar berada di antara matahari dan panel.
- **Aliran energi beranimasi**: partikel bergerak sepanjang kabel; kerapatan dan kecepatannya mengikuti besar daya.
- **Info perhitungan ringkas**: label daya (W) pada tiap jalur dan panel info kecil berisi V, I, P, SOC, volume H₂, serta energi harian.
- **EMS v2 (histeresis)** dan **EMS v1 (satu ambang)** yang dapat dipilih, sehingga fenomena *relay* menyala-mati berulang (kendala nomor 4 pada LKM-3) dapat diamati langsung.
- **Skala waktu** (1× hingga 3600×) agar proses pengisian baterai dan elektrolisis yang aslinya berjam-jam dapat dilihat dalam detik.
- **Dasbor ilustratif** pada laptop dan ponsel di dalam kanvas, meniru tampilan dasbor ESP32 pada Lampiran 4 LKM-3.
- Tombol **Jeda**, **Reset**, dan **Skenario Bawaan**.

---

## 4. Tata Letak Tampilan

Sesuai kebutuhan, **kanvas hanya berisi benda-benda (objek) sistem**. Semua kontrol dan informasi teks panjang diletakkan di luar kanvas dengan elemen HTML/CSS.

```
┌──────────────────────────────────────────────────────────────┐
│  HEADER: judul simulasi                          [Jeda][Reset]│
├───────────────────────────────────────────┬──────────────────┤
│                                           │  PANEL KONTROL   │
│                CANVAS                     │  • Matahari      │
│   matahari, awan, waduk mini + panel,     │  • Awan          │
│   kotak IoT, baterai, lampu, elektroliser │  • Waktu         │
│   (tabung H₂/O₂), fuel cell, laptop,      │  • Beban & EMS   │
│   ponsel, kabel + partikel energi,        │  ──────────────  │
│   tag daya (W) kecil                      │  PANEL INFO      │
│                                           │  (angka ringkas) │
├───────────────────────────────────────────┴──────────────────┤
│  FOOTER: rumus ringkas & catatan asumsi (dapat dilipat)      │
└──────────────────────────────────────────────────────────────┘
```

Pada layar sempit (< 900 px), panel kontrol berpindah ke bawah kanvas.

**Isi kanvas** (koordinat logis 1200 × 675, diskalakan otomatis):

| Elemen | Perkiraan posisi (x, y) | Catatan |
|--------|------------------------|---------|
| Matahari | (140, 70) | Ukuran dan cahaya (*glow*) mengikuti slider |
| Awan (1–3 buah) | y ≈ 60–130 | Bergerak horizontal, dapat diseret |
| Waduk mini + panel terapung | (60–400, 200–320) | Panel miring ±10°, bergoyang pelan di air |
| Kotak kontrol IoT (ESP32, INA219 ×2, relay) | (430–650, 130–250) | Lampu indikator *relay* menyala sesuai status EMS |
| Baterai Li-ion 3,7 V 5.200 mAh | (460–620, 270–330) | Bilah isi menunjukkan SOC |
| Lampu LED (beban) | (690, 240) | Terang sesuai daya yang diterima |
| Elektroliser + tabung H₂ dan O₂ | (780–930, 130–320) | Tinggi air dalam tabung menunjukkan volume gas; gelembung saat aktif |
| *Fuel cell* | (950, 280) | Menyala saat memasok beban |
| Dasbor laptop dan ponsel | (1040–1180, 190–320) | Menampilkan nilai ringkas |

---

## 5. Daftar Komponen (12 Objek)

Penomoran mengikuti gambar rangkaian pada LKM-3 (Lampiran 4).

| No | Komponen | Spesifikasi (LKM-3) | Peran dalam simulasi |
|----|----------|---------------------|----------------------|
| 1 | Wadah air (waduk mini) | ±40 × 25 × 20 cm, air ±15 cm | Latar tempat panel mengapung; efek visual air |
| 2 | Panel surya terapung | 6 V 5 W, ±25 × 18 cm, miring 10° | Sumber daya; keluaran bergantung iradiansi |
| 3 | Baterai Li-ion | 3,7 V, 5,2 Ah (2×18650) ≈ 19,24 Wh | Penyimpan jangka pendek |
| 4 | ESP32 (WiFi) | DevKit V1 | Pengendali EMS dan pengirim data dasbor |
| 5 | Sensor tegangan & arus | INA219 ×2 | Sumber nilai V, I, P pada panel info |
| 6 | Lampu LED | DC 5 V 1 W | Beban utama |
| 7 | Kotak kontrol IoT | Relay 4 kanal, TP4056, boost, buck | Wadah elektronik; indikator relay CH1–CH4 |
| 8 | Dasbor laptop | Web, data tiap 1 detik | Tampilan data ilustratif |
| 9 | Dasbor ponsel | Web, data tiap 1 detik | Tampilan data ilustratif |
| 10 | Prototipe lengkap | Gabungan 1–9 | Tampilan keseluruhan kanvas |
| 11 | Elektroliser | H₂ : O₂ = 2 : 1, 2,0 V, ±0,5 A | Mengubah surplus listrik menjadi H₂ |
| 12 | *Fuel cell* | PEM, ±50% | Mengubah H₂ menjadi listrik saat defisit |

---

## 6. Model Fisika dan Perhitungan

Model dibuat **sesederhana mungkin namun konsisten secara energi**. Semua perhitungan berjalan pada langkah waktu simulasi `dt_sim` (detik simulasi).

### 6.1 Iradiansi efektif

```
G = G_max · s · T_awan
```

| Simbol | Arti | Nilai |
|--------|------|-------|
| `G_max` | Iradiansi acuan (STC) | 1000 W/m² |
| `s` | Slider matahari | 0 – 1 |
| `T_awan` | Transmitansi awan (0,15 – 1) | Lihat [bagian 7](#7-mekanisme-awan) |

### 6.2 Daya panel

```
P_pv = P_stc · (G / 1000) · PR · [1 − γ · (T_sel − 25)]
T_sel = T_amb + ((NOCT − 20) / 800) · G
```

- `P_stc = 5 W`, `PR = 0,8` (faktor kinerja pada LKM-2/LKM-3). Pada `G = 1000 W/m²` hasilnya **4,0 W**, sesuai nilai dasbor contoh (5,12 V × 0,80 A ≈ 4,10 W).
- `γ = 0,004 /°C` (koefisien suhu silikon, asumsi umum), `NOCT = 45 °C`, `T_amb = 30 °C` (asumsi, dapat diubah).
- Efisiensi panel acuan (turunan, bukan input): `η = 5 / (0,045 × 1000) ≈ 11%`.
- Bila `G = 0`, maka `P_pv = 0`.

Tegangan dan arus panel yang **ditampilkan** diturunkan dari daya:

```
V_pv ≈ 5,1 V (tetap ilustratif saat P_pv > 0),   I_pv = P_pv / V_pv
```

### 6.3 Beban

| Beban | Daya | Kondisi |
|-------|------|---------|
| ESP32 + sensor | 0,4 W | Selalu aktif |
| Lampu LED | 1,0 W | Aktif bila saklar lampu ON |
| Elektroliser | `V_el · I_el` = 2,0 V × 0,5 A = 1,0 W | Aktif bila EMS memberi status SURPLUS |

### 6.4 Baterai

Kapasitas energi: `E_max = 3,7 V × 5,2 Ah = 19,24 Wh`.

Daya bersih pada bus: `P_net = P_pv − P_beban_listrik`.

```
jika P_net ≥ 0 :  dE/dt = +η_chg · P_net     (mengisi, η_chg = 0,85)
jika P_net < 0 :  dE/dt = P_net / η_dis      (mengosongkan, η_dis = 0,90)
SOC = E / E_max   (dibatasi 0 – 1)
```

Tegangan rangkaian terbuka dihitung dengan interpolasi linear tabel berikut, lalu ditambah penurunan akibat resistansi dalam `R_int = 0,15 Ω`:

| SOC | 0% | 10% | 50% | 90% | 100% |
|-----|-----|-----|-----|-----|------|
| V_oc (V) | 3,00 | 3,40 | 3,70 | 4,05 | 4,20 |

```
V_bat = V_oc(SOC) + I_bat · R_int        (I_bat > 0 saat mengisi, < 0 saat mengosongkan)
```

Resistansi dalam sengaja disertakan karena membuat tegangan "melompat" ketika arus berganti arah. Efek ini yang menimbulkan *chattering* pada EMS v1 dan diredam oleh histeresis pada EMS v2.

### 6.5 Logika EMS

**EMS v2 (default, sesuai Lampiran 2 LKM-3)**

| Kondisi | Aksi |
|---------|------|
| `V_bat ≥ 4,10 V` dan `P_pv > P_beban` | **SURPLUS**: relay CH2 ON → elektroliser aktif (buck 2,0 V) |
| `V_bat < 3,95 V` | Elektroliser OFF (histeresis) |
| `V_bat ≤ 3,40 V` selama ≥ 5 s | **DEFISIT**: jika stok H₂ ≥ 5 mL → CH3 (*fuel cell*); jika tidak → CH4 (PLN, cadangan terakhir) |
| `V_bat ≥ 3,80 V` | Kembali ke mode NORMAL (lampu dari baterai/panel) |
| Lainnya | **NORMAL**: lampu dari baterai/panel (CH1) |

**EMS v1 (pembanding, sesuai Bagian 7 LKM-3 sebelum perbaikan)**

- Elektroliser ON bila `V_bat ≥ 4,1 V`, OFF bila di bawahnya (tanpa histeresis).
- Defisit bila `V_bat < 3,5 V` tanpa tundaan 5 detik dan tanpa pemeriksaan stok H₂.

Pengamatan yang diharapkan: pada v1 elektroliser menyala-mati berulang di sekitar 4,1 V; pada v2 perilaku stabil.

### 6.6 Elektroliser (Hukum Faraday)

```
n_H2  = η_F · I_el · t / (2F)            [mol]
V_H2  = n_H2 · V_m                       [L]
V_O2  = V_H2 / 2                         (rasio 2 : 1)
```

| Konstanta | Nilai |
|-----------|-------|
| `F` | 96.485 C/mol |
| `V_m` (25 °C, 1 atm) | 24,465 L/mol |
| `η_F` (efisiensi Faraday; menirukan kebocoran selang) | 100% default, dapat diturunkan melalui slider |
| Kapasitas tiap tabung | 50 mL (gelas ukur 50 mL pada daftar alat LKM-3) |

Pemeriksaan: `I = 0,5 A`, `t = 60 s` → `V_H2 ≈ 3,8 mL`, sehingga 10 menit menghasilkan ±38 mL (cocok dengan skenario uji nomor 5 LKM-3).

Bila tabung H₂ penuh (50 mL), elektroliser dihentikan otomatis sebagai pengaman.

### 6.7 *Fuel cell*

Energi kimia H₂ (LHV): 33,3 kWh/kg, setara **241,8 kJ/mol** atau **±2,74 mWh per mL** H₂ (25 °C).

```
P_fc_in  = P_beban_fc / η_fc            (η_fc = 0,50)
n_H2_pakai = P_fc_in · dt / E_mol       (E_mol = 67,2 Wh/mol)
```

Contoh pemeriksaan kewajaran:

| Besaran | Perhitungan | Hasil |
|---------|-------------|-------|
| Energi kimia 38 mL H₂ | 38 × 2,74 mWh | ≈ 104 mWh |
| Listrik dari *fuel cell* (50%) | 104 × 0,5 | ≈ 52 mWh |
| Lama lampu 1 W menyala | 52 mWh ÷ 1 W | **≈ 188 detik (±3 menit)** |
| Efisiensi elektroliser pada 2,0 V | 104 mWh ÷ 166,7 mWh (1 W × 10 menit) | ≈ 63% |

Catatan: efisiensi elektroliser sebesar ≈ 63% (hasil dari 2,0 V pada prototipe) berbeda dari ≈ 67% pada Lampiran 1 LKM-3, karena Lampiran 1 memakai asumsi elektroliser industri (±50 kWh/kg H₂; U.S. DOE, 2018). Keduanya valid pada konteks masing-masing, dan simulasi memakai angka prototipe.

### 6.8 Neraca energi harian (referensi validasi)

| Besaran | Rumus | Nilai |
|---------|-------|-------|
| Produksi panel | 5 W × 4 jam × 0,8 | 16 Wh/hari |
| Konsumsi ESP32 | 0,4 W × 24 jam | 9,6 Wh |
| Konsumsi lampu | 1 W × 4 jam | 4,0 Wh |
| Total konsumsi | | 13,6 Wh |
| **Surplus** | 16 − 13,6 | **2,4 Wh/hari** |

Surplus ini cukup untuk elektrolisis 1 W selama ±2,4 jam (≈ 490 mL H₂ bila `η_F = 100%` dan seluruh surplus dialihkan).

### 6.9 Tabel parameter

Semua parameter dikumpulkan di `js/config.js`. Kolom **Sumber** membedakan nilai yang berasal dari LKM dengan asumsi tambahan.

| Parameter | Nilai | Sumber |
|-----------|-------|--------|
| `P_stc` | 5 W | LKM-3 |
| `PR` | 0,8 | LKM-3 |
| Luas panel | 0,045 m² | LKM-3 |
| Baterai | 3,7 V; 5,2 Ah | LKM-3 |
| `P_esp` | 0,4 W | LKM-3 |
| `P_lampu` | 1 W | LKM-3 |
| `V_el`, `I_el` | 2,0 V; 0,5 A | LKM-3 |
| `η_fc` | 0,50 | LKM-3 |
| Ambang EMS v2 | 4,10 / 3,95 / 3,40 / 3,80 V; tunda 5 s | LKM-3 (Lampiran 2) |
| Stok H₂ minimum | 5 mL | LKM-3 (Lampiran 2) |
| `η_chg`, `η_dis` | 0,85; 0,90 | **Asumsi** |
| `R_int` | 0,15 Ω | **Asumsi** |
| Tabel V_oc(SOC) | Lihat 6.4 | **Asumsi** |
| `γ`, `NOCT`, `T_amb` | 0,004 /°C; 45 °C; 30 °C | **Asumsi** |
| `T_awan,min` (awan tebal) | 0,15 | **Asumsi** |

---

## 7. Mekanisme Awan

Awan bukan sekadar gambar; ia memengaruhi hasil perhitungan.

### 7.1 Model geometri

Berkas `js/weather.js` menyimpan daftar awan, tiap awan berupa elips:

```js
{ x, y, rx, ry, density, speed }   // density 0–1, speed dalam px/detik
```

Garis pandang matahari ke panel adalah segmen dari titik matahari `S` ke pusat panel `P`. Untuk tiap awan:

1. Hitung jarak terpendek `d` dari titik tengah awan ke segmen `S–P`.
2. Hitung faktor tutupan `c = 1 − smoothstep(0,6 · r_eff, 1,0 · r_eff, d)` dengan `r_eff` jari-jari efektif elips pada arah tegak lurus segmen. Tepi awan menjadi transisi halus, bukan batas keras.
3. Transmitansi awan tersebut: `T_i = 1 − density · c · (1 − T_min)` dengan `T_min = 0,15`.

Transmitansi total: `T_awan = Π T_i`.

Nilai `T_min = 0,15` mewakili cahaya difus yang tetap lolos pada awan tebal, sehingga daya tidak jatuh persis ke nol saat mendung. Nilai ini asumsi, bukan data LKM.

### 7.2 Mode gerak awan

| Mode | Perilaku |
|------|----------|
| **Seret manual** | Awan diseret dengan mouse/sentuhan; kecepatan otomatis dijeda sementara |
| **Otomatis (angin)** | Awan bergerak dengan kecepatan dan arah sesuai slider angin; muncul kembali dari sisi seberang bila keluar kanvas |
| **Tutup Awan** | Awan bergerak halus (*ease-in-out*, ±3 detik) ke posisi tepat di atas panel |
| **Buka Awan** | Awan bergerak halus menjauhi garis pandang hingga di luar bayangan |

### 7.3 Efek visual tambahan

- Saat awan menutup, langit dan air sedikit meredup, dan pantulan cahaya pada panel berkurang.
- Matahari tetap terlihat redup di belakang awan sesuai `T_awan`.

---

## 8. Visualisasi Aliran Energi

Kabel digambar mengikuti gambar rangkaian LKM-3 (merah = positif, hitam = negatif, garis putus-putus kuning-hitam = jalur daya panel).

| ID jalur | Dari → ke | Aktif bila |
|----------|-----------|------------|
| W1 | Panel → INA219 #1 → bus kotak IoT | `P_pv > 0` |
| W2 | Bus → baterai (TP4056) | `P_net > 0` (mengisi) |
| W2′ | Baterai → bus (boost 5 V) | `P_net < 0` (mengosongkan) |
| W3 | Bus → lampu (CH1) | Lampu ON dan sumber = baterai/panel |
| W4 | Bus → elektroliser (CH2, buck 2,0 V) | Status SURPLUS |
| W5 | Tabung H₂ → *fuel cell* (jalur gas) | Status DEFISIT dengan stok H₂ cukup |
| W6 | *Fuel cell* → lampu (CH3) | Status DEFISIT dengan stok H₂ cukup |
| W7 | PLN → lampu (CH4) | Defisit dan stok H₂ habis |
| W8 | ESP32 ⇢ laptop/ponsel (WiFi, garis titik) | Selalu |

**Partikel energi**

- Kecepatan: `v = v0 + k · √P` (agar daya kecil tetap terlihat bergerak).
- Jarak antarpartikel: berbanding terbalik dengan `P`.
- Arah mengikuti arah aliran daya (misalnya berbalik pada jalur baterai saat mengosongkan).
- Warna: kuning untuk listrik, biru untuk H₂, abu-abu untuk PLN.

**Tag daya (info perhitungan ringkas di kanvas)**

Teks kecil (misalnya `4,0 W`) di dekat jalur utama: panel, baterai, lampu, elektroliser, *fuel cell*. Tag disembunyikan bila `P < 0,05 W`.

---

## 9. Arsitektur Kode dan Struktur Folder

```
plts-terapung-sim/
├── index.html            # kerangka halaman, kanvas, panel kontrol & info
├── css/
│   └── style.css         # tata letak, tema, responsif
├── js/
│   ├── config.js         # semua konstanta & parameter (lihat 6.9)
│   ├── physics.js        # panel, baterai, elektroliser, fuel cell
│   ├── ems.js            # mesin status EMS v1 dan v2
│   ├── weather.js        # awan, geometri bayangan, T_awan
│   ├── renderer.js       # menggambar semua objek di kanvas
│   ├── particles.js      # partikel energi sepanjang kabel
│   ├── ui.js             # slider, tombol, panel info
│   └── main.js           # inisialisasi & game loop
├── assets/               # opsional: ikon/gambar SVG
└── README.md
```

**Prinsip desain**

- **Pemisahan model dan tampilan**: `physics.js`, `ems.js`, dan `weather.js` tidak menyentuh DOM atau kanvas sehingga dapat diuji sendiri.
- **Tanpa ES Modules**: berkas dimuat memakai `<script>` biasa berurutan (`config` → `physics` → `ems` → `weather` → `particles` → `renderer` → `ui` → `main`) agar `index.html` dapat dibuka langsung lewat `file://` tanpa server. Setiap berkas membungkus kodenya dalam objek namespace global (misalnya `window.Sim = {}`).
- **Satu sumber kebenaran**: seluruh keadaan sistem disimpan dalam satu objek `state`.

**Objek `state` (ringkas)**

```js
state = {
  t: 0,                 // waktu simulasi (s)
  sun: 1.0,             // slider matahari 0–1
  G: 0, tCloud: 1,      // iradiansi & transmitansi awan
  pPV: 0,               // daya panel (W)
  eBat: 0, soc: 0.7, vBat: 3.9,
  mode: 'NORMAL',       // 'SURPLUS' | 'NORMAL' | 'DEFISIT'
  relay: { ch1: true, ch2: false, ch3: false, ch4: false },
  h2: 0, o2: 0,         // volume (mL)
  eDay: { pv: 0, load: 0, h2chem: 0, fc: 0 },   // akumulasi Wh
  flows: { /* daya tiap jalur W1..W8 */ }
}
```

---

## 10. Alur Simulasi (*Game Loop*)

```js
function frame(now) {
  const dtReal = Math.min((now - last) / 1000, 0.1);    // batasi lonjakan tab tidak aktif
  last = now;

  if (!paused) {
    let remaining = dtReal * timeScale;                  // detik simulasi
    while (remaining > 0) {
      const dt = Math.min(remaining, 1.0);               // sub-langkah maksimum 1 s simulasi
      Weather.update(dt);                                // 1. gerakkan awan, hitung T_awan
      Physics.irradiance(state);                         // 2. G
      Physics.panelPower(state);                         // 3. P_pv
      EMS.step(state, dt);                               // 4. keputusan relay (butuh dt untuk tunda 5 s)
      Physics.busAndBattery(state, dt);                  // 5. neraca daya & SOC
      Physics.electrolyzer(state, dt);                   // 6. H2 / O2 (bila CH2 ON)
      Physics.fuelCell(state, dt);                       // 7. konsumsi H2 (bila CH3 ON)
      Physics.accumulate(state, dt);                     // 8. energi harian
      remaining -= dt;
    }
  }
  Particles.update(dtReal, state.flows);                 // animasi tetap mengikuti waktu nyata
  Renderer.draw(ctx, state);
  UI.updateInfo(state);
  requestAnimationFrame(frame);
}
```

Catatan: sub-langkah 1 detik simulasi menjaga stabilitas numerik dan memastikan tunda 5 detik pada EMS tetap akurat walaupun skala waktu 3600×.

---

## 11. Spesifikasi Panel Kontrol

| Kelompok | Kontrol | Jenis | Rentang / pilihan | Default |
|----------|---------|-------|-------------------|---------|
| **Matahari** | Intensitas cahaya | Slider | 0–100% (≈ 0–1000 W/m²) | 100% |
| **Awan** | Tutup Awan / Buka Awan | Tombol | – | – |
| | Mode gerak | Pilihan | Manual / Otomatis | Otomatis |
| | Kerapatan awan | Slider | 0–100% | 70% |
| | Kecepatan angin | Slider | 0–60 px/detik | 12 |
| | Jumlah awan | Slider | 1–3 | 2 |
| **Waktu** | Skala waktu | Pilihan | 1× / 10× / 60× / 600× / 3600× | 60× |
| | Jeda | Tombol | – | – |
| **Beban & EMS** | Lampu | Saklar | ON / OFF | ON |
| | Versi EMS | Pilihan | v1 / v2 | v2 |
| | Efisiensi Faraday `η_F` | Slider | 50–100% | 100% |
| | SOC awal | Slider | 0–100% | 70% |
| | Stok H₂ awal | Slider | 0–50 mL | 0 |
| **Tampilan** | Label komponen 1–12 | Saklar | ON / OFF | OFF |
| | Tag daya | Saklar | ON / OFF | ON |
| | Partikel energi | Saklar | ON / OFF | ON |
| – | Reset | Tombol | Mengembalikan semua ke default | – |

**Panel info (sengaja ringkas)**

| Item | Satuan |
|------|--------|
| Iradiansi `G` dan transmitansi awan `T_awan` | W/m², % |
| Panel: tegangan, arus, daya | V, A, W |
| Baterai: tegangan, SOC | V, % |
| Status EMS dan relay aktif | teks |
| Elektroliser: daya, `V_H₂`, `V_O₂` | W, mL |
| *Fuel cell*: daya keluaran, stok H₂ tersisa | W, mL |
| Energi akumulasi: panel, beban, H₂ | Wh |

**Aksesibilitas dan kenyamanan**

- Semua kontrol dapat dioperasikan dengan keyboard dan memiliki `aria-label`.
- Menghormati `prefers-reduced-motion` (partikel dan goyangan air dikurangi).
- Warna status tidak bergantung pada warna saja (disertai teks).

---

## 12. Skenario Bawaan (*Preset*)

| Skenario | Pengaturan | Yang diamati |
|----------|-----------|--------------|
| **Siang cerah** | Matahari 100%, tanpa awan, SOC 85% | Baterai penuh, masuk SURPLUS, elektrolisis dimulai |
| **Awan lewat** | Matahari 100%, satu awan tebal melintas | Daya panel turun lalu pulih; baterai menutup selisih |
| **Mendung** | Matahari 100%, awan menutup permanen | Daya ≈ 15%; baterai terkuras perlahan |
| **Malam / defisit** | Matahari 0%, SOC 12%, stok H₂ 40 mL | Defisit, tunda 5 s, lampu pindah ke *fuel cell* |
| **Kendala v1** | EMS v1, SOC 93%, matahari 100% | Elektroliser menyala-mati berulang di sekitar 4,1 V |
| **Perbaikan v2** | EMS v2, kondisi sama dengan v1 | Perilaku stabil berkat histeresis |

---

## 13. Cara Menjalankan

**Opsi A, langsung dari berkas**

1. Unduh atau salin seluruh folder `plts-terapung-sim/`.
2. Klik ganda `index.html` (Chrome, Edge, Firefox, atau Safari versi terbaru).

**Opsi B, memakai server lokal (disarankan saat pengembangan)**

```bash
# Python 3
python -m http.server 8000
# lalu buka http://localhost:8000
```

Atau gunakan ekstensi *Live Server* pada VS Code.

**Kebutuhan**: peramban modern dengan dukungan HTML5 Canvas 2D. Tidak ada dependensi eksternal.

---

## 14. Skenario Uji dan Kriteria Penerimaan

Pengujian dilakukan dengan membandingkan keluaran simulasi terhadap perhitungan manual (toleransi ±2%, kecuali dinyatakan lain).

| No | Kondisi uji | Hasil yang diharapkan |
|----|-------------|----------------------|
| T1 | `s = 100%`, tanpa awan, suhu 25 °C (suhu sel dikunci untuk uji) | `P_pv = 4,0 W` |
| T2 | `s = 50%`, tanpa awan | `P_pv ≈ 2,0 W` (arus sebanding intensitas, selaras LKM-2) |
| T3 | `s = 100%`, awan menutup penuh, `density = 1` | `P_pv ≈ 15%` dari T1 (0,6 W) |
| T4 | `s = 0%` | `P_pv = 0 W`; baterai hanya turun |
| T5 | Elektrolisis 10 menit, `I = 0,5 A`, `η_F = 100%` | `V_H₂ ≈ 38 mL`, `V_O₂ ≈ 19 mL` (rasio 2 : 1) |
| T6 | Neraca harian 4 jam efektif tanpa awan | Energi panel ≈ 16 Wh |
| T7 | *Fuel cell* memasok lampu 1 W dari 38 mL H₂ | Lama menyala ≈ 188 detik (±5%) |
| T8 | SOC 12%, matahari 0%, stok H₂ ≥ 5 mL | Setelah 5 detik simulasi di `V_bat ≤ 3,4 V`, relay CH3 ON |
| T9 | Seperti T8 tetapi stok H₂ < 5 mL | Relay CH4 (PLN) ON |
| T10 | EMS v1 di sekitar 4,1 V | Relay CH2 berganti ON/OFF ≥ 3 kali/menit simulasi |
| T11 | EMS v2 pada kondisi sama dengan T10 | Relay CH2 berganti ≤ 1 kali |
| T12 | Kekekalan energi | `ΔE_bat + E_beban + E_rugi = E_pv` dengan selisih < 1% |
| T13 | Tabung H₂ penuh 50 mL | Elektroliser berhenti otomatis |
| T14 | Seret awan melewati garis matahari–panel | `T_awan` turun dan naik halus (tanpa lompatan) |

**Kriteria selesai (*Definition of Done*)**

- [ ] Semua 12 objek tampil di kanvas dan sesuai gambar rangkaian.
- [ ] Slider matahari dan perilaku awan (manual, otomatis, tutup, buka) berfungsi.
- [ ] Angka T1–T14 terpenuhi.
- [ ] Animasi stabil ≥ 30 fps pada laptop standar.
- [ ] Tampilan responsif pada lebar 360 px hingga 1920 px.
- [ ] Tidak ada galat pada konsol peramban.

---

## 15. Keterbatasan Model

Agar penggunaan hasil simulasi proporsional, hal-hal berikut perlu diketahui:

1. **Panel** dimodelkan sebagai sumber daya (`P = P_stc · G/1000 · PR`), bukan kurva I–V lengkap. Perilaku di sekitar titik daya maksimum, pembayangan sebagian (*partial shading*), dan karakteristik pengisi TP4056 disederhanakan.
2. **Awan** dimodelkan sebagai elips dengan transmitansi seragam. Awan nyata tidak seragam, dan pantulan tepi awan (*cloud-edge enhancement*) tidak dimodelkan.
3. **Baterai** memakai tabel V_oc(SOC) dan resistansi dalam konstan. Pengaruh suhu, penuaan, dan sirkuit proteksi diabaikan.
4. **Elektroliser** diasumsikan memakai tegangan tetap 2,0 V. Overpotensial, suhu, dan tekanan gas tidak dimodelkan.
5. **Fuel cell**: efisiensi tetap 50%; kurva polarisasi tidak dimodelkan. Tegangan yang ditampilkan bersifat ilustratif.
6. **Nilai asumsi** (η_chg, η_dis, R_int, tabel V_oc, γ, NOCT, T_min) bukan dari LKM dan sebaiknya dikalibrasi dengan data pengukuran prototipe bila tersedia.
7. **Skala waktu tinggi** membuat energi H₂ dan baterai berubah sangat cepat. Hal ini disengaja untuk visualisasi, bukan prediksi waktu nyata.
8. Hasil simulasi **tidak menggantikan** pengukuran pada prototipe fisik. Fungsinya sebagai alat bantu pemahaman dan eksplorasi.
9. Prototipe dan model berskala kecil (5 W). Ekstrapolasi ke skala Cirata 145 MW pada LKM-3 tidak dilakukan di simulasi ini.

---

## 16. Peta Jalan Pengembangan

**Fase 1: Inti (wajib)**
- [ ] Kerangka halaman, kanvas, dan penskalaan responsif.
- [ ] Objek statis 1–12 dan kabel.
- [ ] Model panel + slider matahari.
- [ ] Awan: gerak otomatis, seret, geometri bayangan.

**Fase 2: Energi dan EMS**
- [ ] Baterai, beban, dan EMS v2.
- [ ] Elektroliser dan *fuel cell* beserta tabung gas.
- [ ] Partikel energi dan tag daya.

**Fase 3: Pembelajaran**
- [ ] EMS v1 sebagai pembanding, *preset* skenario.
- [ ] Panel info dan rumus ringkas yang dapat dilipat.
- [ ] Pengujian T1–T14.

**Fase 4: Pengembangan lanjutan (opsional)**
- [ ] Siklus siang–malam otomatis (posisi matahari bergerak).
- [ ] Grafik daya terhadap waktu (5 menit terakhir) seperti dasbor Lampiran 4.
- [ ] Mode "Efek fotolistrik" mini untuk menghubungkan ke LKM-2.
- [ ] Ekspor data simulasi ke CSV.
- [ ] Sensor suhu panel dan perbandingan panel darat vs terapung.
- [ ] Dukungan bahasa Inggris.

---

## 17. Referensi

Aditya, I. A. A., Pratiwi, Z. B., Hakam, D. F., & Kemala, P. N. (2025). Green hydrogen as a catalyst for Indonesia's energy transition: Challenges, opportunities, and policy frameworks. *International Journal of Energy Economics and Policy, 15*(2), 182–194. https://doi.org/10.32479/ijeep.17380

Amiruddin, A., Dargaville, R., & Gawler, R. (2024). Optimal integration of renewable energy, energy storage, and Indonesia's super grid. *Energies, 17*(20), 5061. https://doi.org/10.3390/en17205061

Rifansyah, M., & Hakam, D. F. (2024). Techno economic study of floating solar photovoltaic project in Indonesia using RETScreen. *Cleaner Energy Systems, 9*, 100155. https://doi.org/10.1016/j.cles.2024.100155

U.S. Department of Energy. (2018). *Fact of the month August 2018: Global electrolyzer sales reach 100 MW/year*.

University of Colorado Boulder. (n.d.). *PhET interactive simulations*. https://phet.colorado.edu

Tim MSTR FPMIPA UPI. (2026). *LKM-1, LKM-2, dan LKM-3 MSTR Energi* [Lembar kerja mahasiswa]. Universitas Pendidikan Indonesia.

---

## Tim Penyusun

**Kelompok 1, MSTR Energi, FPMIPA, Universitas Pendidikan Indonesia**

- Raffi Adzril Alfaiz (2308355)
- Muhammad Igin Adigholib (2301125)
- Rahmat Taufik Al hidayah (2300414)
- Muhammad Helmi Rahmadi (2311574)
- Muhammad Farhan (2309323)
