# Menfes Bot WhatsApp

Bot WhatsApp untuk mengirim pesan anonim (menfes) menggunakan Node.js dan Baileys.

## Fitur

- Kirim pesan anonim ke pengguna WhatsApp lain
- Sistem pengguna gratis dan premium
- Batasan penggunaan untuk pengguna gratis
- Sistem privasi (penerima dapat menerima atau menolak pesan)
- Dukungan untuk perintah teks dan tombol interaktif

## Persyaratan

- Node.js v14 atau lebih tinggi
- NPM atau PNPM

## Instalasi

1. Clone repositori ini:
\`\`\`bash
git clone https://github.com/username/menfes-bot.git
cd menfes-bot
\`\`\`

2. Install dependensi:
\`\`\`bash
npm install
# atau
pnpm install
\`\`\`

3. Salin file `.env.example` ke `.env` dan isi dengan informasi yang diperlukan:
\`\`\`bash
cp .env.example .env
\`\`\`

4. Edit file `.env` dan isi nomor admin:
\`\`\`
ADMIN_NUMBER=+628xxxxxxxxxx
\`\`\`

5. Jalankan bot:
\`\`\`bash
node main.js
\`\`\`

6. Scan kode QR yang muncul di terminal dengan WhatsApp Anda.

## Penggunaan

### Perintah untuk Pengguna

- `.menfes +628xxxxxxxxxx | Inisial | Isi pesan` - Kirim pesan anonim
- `.premium` - Lihat informasi fitur premium
- `.stop` - Hentikan percakapan aktif

### Perintah untuk Admin

- `.activate_premium +628xxxxxxxxxx 7` - Aktifkan premium untuk pengguna selama 7 hari
- `.activate_premium +628xxxxxxxxxx 14` - Aktifkan premium untuk pengguna selama 14 hari

## Struktur Proyek

\`\`\`
/menfes_bot
├── main.js                    # Entry point bot
├── handlers/
│   ├── messageHandler.js      # Handler parsing pesan .menfes, .stop, dll
│   └── premiumHandler.js      # Handler fitur premium & aktivasi
├── database/
│   ├── users.json             # Data user biasa & premium
│   ├── menfes_log.json        # Riwayat menfes & status penerima
├── utils/
│   ├── baileysClient.js       # Setup koneksi Baileys
│   ├── helper.js              # Fungsi bantu: format, validasi, dsb
│   └── qris.png               # Gambar QRIS untuk pembayaran
├── .env                       # Token, ID admin, dan konfigurasi lain
└── README.md                  # Dokumentasi penggunaan
\`\`\`

## Batasan Penggunaan

### Pengguna Gratis
- Kirim maksimal 3 pesan per hari
- Hanya ke 1 kontak per hari
- Pesan dikirim anonim (dengan inisial)

### Pengguna Premium
- Kirim unlimited pesan per hari
- Bisa kirim ke maks. 5 kontak berbeda per hari
- Aktivasi via pembayaran QRIS, durasi 7 atau 14 hari

## Lisensi

MIT
