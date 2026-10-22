require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

function logger(req, res, next) {
    const waktu = new Date().toISOString();
    console.log(`[${waktu}] ${req.method} ${req.url}`);
    next(); // wajib, agar request lanjut ke handler berikutnya
}

function cekApiKey(req, res, next) {
    function errorHttp(status, message) {
        const err = new Error(message);
        err.status = status;
        return err;
    }
    const apiKey = req.headers['x-api-key'];

    if (apiKey !== process.env.API_KEY) {
        return res.status(401).json({ message: 'API key tidak valid' });
    }

    next();
}

// Didaftarkan sebelum route agar mencatat seluruh request
app.use(logger);
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
// Middleware agar req.body (JSON) dapat dibaca
app.use(express.json());

// Data sementara (disimpan di memori, hilang saat server restart)
let siswasmk3palembang = [
    { id: 1, nama: 'Wendi', jurusan: 'Ototmotif' },
    { id: 2, nama: 'Asep', jurusan: 'TKJ' },
    { id: 3, nama: 'Santi', jurusan: 'Pemasaran' },
];
let nextId = 3; // penghitung id untuk data baru

app.get('/', (req, res) => {
    res.send('Server Express.js berjalan!');
});

// GET /mahasiswa -> menampilkan seluruh data
app.get('/siswasmk3palembang', (req, res) => {
    res.json(siswasmk3palembang);
});

// GET /mahasiswa/:id -> menampilkan satu data berdasarkan id
app.get('/siswasmk3palembang/:id', (req, res, next) => {
    const id = parseInt(req.params.id);
    const data = siswasmk3palembang.find((m) => m.id === id);

    if (!data) return next(errorHttp(404, 'Data tidak ditemukan'));
    res.json(data);
});

// POST /mahasiswa -> tambah data baru
app.post('/siswasmk3palembang', cekApiKey, (req, res, next) => {
    const { nama, jurusan } = req.body;

    if (!nama || !jurusan) {
        return next(errorHttp(400, 'nama dan jurusan wajib diisi'));
    }

    const baru = { id: nextId++, nama, jurusan };
    siswasmk3palembang.push(baru);
    res.status(201).json(baru);
});

// PUT /mahasiswa/:id -> ubah data
app.put('/siswasmk3palembang/:id', cekApiKey, (req, res) => {
    const id = parseInt(req.params.id);
    const index = siswasmk3palembang.findIndex((m) => m.id === id);

    if (index === -1) return next(errorHttp(404, 'Data tidak ditemukan'));

    siswasmk3palembang[index] = { ...siswasmk3palembang[index], ...req.body, id };
    res.json(siswasmk3palembang[index]);
});

// DELETE /mahasiswa/:id -> hapus data
app.delete('/siswasmk3palembang/:id', cekApiKey, (req, res) => {
    const id = parseInt(req.params.id);
    const index = siswasmk3palembang.findIndex((m) => m.id === id);

    if (index === -1) return next(errorHttp(404, 'Data tidak ditemukan'));

    siswasmk3palembang.splice(index, 1);
    res.status(204).send();
});

// Handler 404: rute yang tidak ada
app.use((req, res) => {
    res.status(404).json({ message: `Rute ${req.method} ${req.originalUrl} tidak ditemukan` });
});

// Error handler: WAJIB 4 parameter
app.use((err, req, res, next) => {
    // Body JSON yang rusak (dilempar oleh express.json())
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ message: 'Format JSON tidak valid' });
    }

    const status = err.status || 500;

    if (status === 500) {
        console.error(err.stack); // detail hanya dicatat di server
        return res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }

    res.status(status).json({ message: err.message });
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});