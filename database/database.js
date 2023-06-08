const mysql = require('mysql2');

// Buat koneksi dengan database
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'dbcapstone'
});

// Ekspor objek koneksi untuk digunakan di aplikasi
module.exports = connection;
