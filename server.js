// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Konfigurasi Socket.IO
// Izinkan koneksi dari semua origin (*) untuk pengembangan.
// Di produksi, ganti '*' dengan domain frontend Anda (misal: 'http://yourdomain.com')
const io = socketIo(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

// Array untuk menyimpan riwayat pesan sementara (akan hilang saat server restart)
const chatMessages = []; 

// Middleware untuk menyajikan file statis dari folder saat ini
app.use(express.static(path.join(__dirname)));

// Rute untuk halaman utama
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Rute untuk halaman admin login
app.get('/admin_login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin_login.html'));
});

// Handle koneksi Socket.IO
io.on('connection', (socket) => {
    console.log(`Pengguna terhubung: ${socket.id}`);

    // Kirim riwayat chat yang ada ke pengguna baru
    socket.emit('chatHistory', chatMessages);

    // Mendengarkan pesan dari klien (baik pembeli maupun admin)
    socket.on('sendMessage', (message) => {
        // Tambahkan ID unik ke setiap pesan untuk identifikasi
        const fullMessage = {
            id: Date.now() + Math.random(), // ID unik sederhana
            senderId: socket.id, // ID socket pengirim
            role: message.role, // 'user' atau 'admin'
            content: message.content,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        chatMessages.push(fullMessage); // Simpan pesan ke riwayat

        // Kirim pesan ke semua klien yang terhubung (broadcast)
        // Di aplikasi nyata, Anda mungkin ingin mengirim ke 'room' tertentu
        // atau ke admin saja jika pesan dari user, dan sebaliknya.
        io.emit('receiveMessage', fullMessage); 
        console.log(`Pesan diterima dari ${fullMessage.role} (${socket.id}): ${fullMessage.content}`);
    });

    // Handle saat klien terputus
    socket.on('disconnect', () => {
        console.log(`Pengguna terputus: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
    console.log('Tekan Ctrl+C untuk menghentikan server.');
});

