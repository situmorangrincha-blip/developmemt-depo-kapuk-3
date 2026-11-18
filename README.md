# Update Development Depo — Web Presentation

Presentasi web (static, tanpa build step) dari PPT *Update Development Depo*. Siap deploy ke Vercel.

## Deploy (GitHub → Vercel)
1. Buat repo baru di GitHub, upload **seluruh isi folder ini** (`index.html`, `css/`, `js/`, `assets/`, `vercel.json`).
2. Di Vercel: **Add New → Project → Import** repo tadi.
3. Framework Preset: **Other**. Build Command & Output Directory dikosongkan. Klik **Deploy**.

> File terbesar `assets/video-2.mp4` ±44 MB (masih di bawah batas 100 MB per file GitHub).
> Kalau upload lewat browser GitHub, upload folder `assets/` terpisah supaya tidak timeout.

## Cara pakai saat presentasi
| Tombol | Fungsi |
|---|---|
| `→` / `Space` / `PageDown` | Slide berikutnya |
| `←` / `PageUp` | Slide sebelumnya |
| `Home` / `End` | Slide pertama / terakhir |
| `F` | Layar penuh |
| `L` | (Slide 4) tampilkan semua angka di grafik |
| Klik gambar | Zoom gambar, `Esc` untuk tutup |

Link langsung ke slide tertentu: `https://domain-kamu.vercel.app/#5`

## Edit konten
- **Data grafik Trend Sales (slide 4):** array `SERIES` di `js/app.js`.
- **Angka badge peta (slide 5), target (slide 10), teks:** langsung di `index.html`.
- **Ganti gambar/video:** timpa file di `assets/` dengan nama yang sama.
- **Warna & motion:** variabel di bagian atas `css/style.css` (`--orange`, `--ease`, dll).
