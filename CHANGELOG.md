# 📜 Catatan Log Pengembangan (CHANGELOG)
**Proyek:** Aplikasi Silsilah Keluarga Berbasis AI
**Versi:** 1.0.0 (Final Release Candidate)

## [Pembaruan Terkini] - 01 Mei 2026

### ✨ Fitur Baru & Peningkatan Cerdas
*   **Arsitektur Relasional Silsilah:** Mengubah struktur statis menjadi pohon dinamis. Pengguna kini dapat menambahkan anggota baru dengan mendefinisikan relasi (Suami, Istri, Anak, Ayah, Ibu, Saudara) terhadap anggota yang sudah ada. Sistem akan merakit cabang keturunan ke atas (Leluhur) atau ke bawah (Keturunan) secara otomatis.
*   **Integrasi Gemini AI:** Menambahkan modul `@google/genai` sebagai "Penjaga Gerbang Silsilah". AI memvalidasi setiap masukan data agar sesuai dengan logika manusia (misal: memblokir input "Suami" yang bergender Perempuan) dengan pesan teguran yang sangat sopan dan hangat.
*   **Sistem Hak Akses (Role-Based Access Control) 4 Lapis:**
    *   **Super-Admin:** Akses penuh (terkunci eksklusif untuk email `auliazhr58@gmail.com`).
    *   **Admin:** Dapat menambah dan mengedit anggota, serta mengelola Editor, namun tidak bisa menghapus anggota.
    *   **Editor:** Hanya dapat menambah/mengedit teks. Tidak memiliki wewenang untuk mengubah foto profil apalagi menghapus anggota.
    *   **Guest (Tamu):** Akses *read-only* (hanya lihat). Tombol navigasi dan formulir disembunyikan.
*   **Siluet Cerdas:** Foto profil yang dibiarkan kosong secara cerdas akan diisi oleh gambar siluet vektor yang menyesuaikan status gender (Biru/Merah Muda).
*   **Integrasi Kamera Asli:** Menggunakan atribut `capture="user"` agar tombol unggah foto langsung terkoneksi dengan aplikasi kamera atau galeri bawaan ponsel pengguna.

### 🛠️ Perbaikan & Optimalisasi (Bug Fixes)
*   **Keamanan Email:** Memperbaiki sistem validasi email dengan algoritma *case-insensitive* (`toLowerCase()`) untuk memastikan pengguna Super-Admin tidak terlempar ke level Guest hanya karena salah penggunaan huruf kapital.
*   **Konflik Klik Layar (Zoom Interception):** Memindahkan deretan tombol aksi (Tambah, Unduh, Cetak) ke luar batas kanvas (*TransformWrapper*) sehingga dapat diakses secara instan tanpa terhalang logika pergeseran peta.
*   **Kalibrasi Zoom Native:** Mematikan fitur klik ganda yang liar, menurunkan sensitivitas roda mouse ke `0.08`, dan mengubah rasio cubitan jari menjadi `1:1` agar pergerakan silsilah semulus aplikasi peta komersial.
*   **Resolusi Responsif:** Menerapkan CSS `max-content` pada pembungkus pohon agar silsilah tidak "kesepian" di layar lebar ponsel, dan secara sempurna menyebar mengikuti lebar monitor di desktop.

---
*Dibuat secara otomatis oleh Asisten AI Google DeepMind.*
