// const mysql = require('mysql');

// // Buat koneksi dengan database
// const connection = mysql.createConnection({
//   host: 'localhost',
//   user: 'root',
//   password: '',
//   database: 'dbcapstone'
// });

// // Ekspor objek koneksi untuk digunakan di aplikasi
// module.exports = connection;

const mysql = require('mysql');

// Buat koneksi ke database
const connection = mysql.createConnection({
  host: '34.101.76.176',
  user: 'root',
  password: 'dbserver',
  database: 'capstone'
});

// Ekspor objek koneksi untuk digunakan di aplikasi
module.exports = connection;
