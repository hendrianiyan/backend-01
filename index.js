const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const connection = require('./database/database');
const tf = require('tensorflow');

const app = express();
app.use(bodyParser.json());

// Simulasi penyimpanan data pengguna
const users = []; // Menyimpan data pengguna sementara dalam array
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
  
    if (!token) {
      return res.status(401).json({ message: 'Token tidak ditemukan' });
    }
  
    jwt.verify(token, 'rahasia', (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Token tidak valid' });
      }
  
      req.decoded = decoded;
      next();
    });
  };
// Rute registrasi pengguna
app.post('/register', (req, res) => {
  const { username,nama, email, password, kelamin, usia, berat, tinggi, penyakit } = req.body;

  // Periksa apakah pengguna dengan username tersebut sudah terdaftar
  const existingUser = users.find(user => user.username === username);
  if (existingUser) {
    return res.status(409).json({ message: 'Username sudah terdaftar' });
  }

  // Enkripsi password sebelum disimpan
  const hashedPassword = bcrypt.hashSync(password, 10);

  // Simpan data pengguna ke dalam database
  connection.query(
    'INSERT INTO user (username, nama, email, password, kelamin, usia, berat, tinggi, penyakit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [username,nama, email, hashedPassword, kelamin, usia, berat, tinggi, penyakit],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Terjadi kesalahan server' });
      }

      res.status(201).json({ message: 'Registrasi berhasil' });
    }
  );
});


// Rute login pengguna
app.post('/login', (req, res) => {
    const { username, password } = req.body;
  
    // Periksa apakah pengguna dengan username tersebut ada di database
    connection.query(
      'SELECT * FROM user WHERE username = ?',
      [username],
      (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Terjadi kesalahan server' });
        }
  
        // Periksa apakah pengguna ditemukan
        if (results.length === 0) {
          return res.status(401).json({ message: 'Username atau password salah' });
        }
  
        const user = results[0];
  
        // Periksa kecocokan password
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Terjadi kesalahan server' });
          }
  
          if (!isMatch) {
            return res.status(401).json({ message: 'Username atau password salah' });
          }
  
          // Buat token otentikasi menggunakan JSON Web Token (JWT)
          const token = jwt.sign({ username: user.username }, 'rahasia', { expiresIn: '3h' });
  
          // Kirim respons dengan nama pengguna dan token
          res.status(200).json({ message: 'Login berhasil', nama: user.nama, token });
        });
      }
    );
  });


app.delete('/delete/:username', (req, res) => {
  const { username } = req.params;

  // Periksa apakah pengguna dengan username dan email tersebut ada di database
  connection.query(
    'DELETE FROM user WHERE username = ?',
    [username],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Terjadi kesalahan server' });
      }

      // Periksa apakah pengguna berhasil dihapus
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
      }

      res.status(200).json({ message: 'Pengguna berhasil dihapus' });
    }
  );
});


app.put('/update/:username', (req, res) => {
    const { username } = req.params;
  
    // Dapatkan data yang akan diupdate dari body permintaan
    const { newUsername,nama,  newPassword, email, kelamin, usia, berat, tinggi, penyakit } = req.body;
  
    // Query database untuk memeriksa apakah pengguna dengan newUsername sudah ada
    connection.query(
      'SELECT * FROM user WHERE username = ?',
      [newUsername],
      (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Terjadi kesalahan server' });
        }
  
        // Periksa apakah pengguna dengan newUsername sudah terdaftar
        if (result.length > 0) {
          return res.status(409).json({ message: 'Username sudah terdaftar' });
        }
  
        // Enkripsi password baru sebelum disimpan
        const hashedPassword = bcrypt.hashSync(newPassword, 10);
  
        // Query database untuk memperbarui data pengguna berdasarkan username
        connection.query(
          'UPDATE user SET username = ?,nama = ?, password = ?,email = ?,  kelamin = ?, usia = ?, berat = ?, tinggi = ?, penyakit = ? WHERE username = ?',
          [newUsername, nama,hashedPassword,email, kelamin, usia, berat, tinggi, penyakit, username],
          (err, result) => {
            if (err) {
              console.error(err);
              return res.status(500).json({ message: 'Terjadi kesalahan server' });
            }
  
            // Periksa apakah pengguna berhasil diperbarui
            if (result.affectedRows === 0) {
              return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
            }
  
            res.status(200).json({ message: 'Pengguna berhasil diperbarui' });
          }
        );
      }
    );
  });
  
app.get('/load-model', (req, res) => {
  const modelPath = './model.h5';
  tf.loadLayersModel(modelPath)
    .then((model) => {
      // Lakukan operasi atau prediksi menggunakan model yang dimuat
      // Contoh:
      const input = tf.tensor2d([[1, 2, 3]]);
      const output = model.predict(input);
      res.json({ result: output.dataSync() });
    })
    .catch((error) => {
      res.status(500).json({ error: error.message });
    });
});
  
  




// // Jalankan server pada port 3000
// app.listen(3000, () => {
//   console.log('Server berjalan pada port 3000');
// });

const NODE_ENV = process.env.NODE_ENV || 'development'
const HOST = process.env.NODE_ENV !== 'production' ? 'localhost' : '0.0.0.0'
const PORT = process.env.PORT || 3000

app.listen(PORT, HOST,  () => {
  console.log(`NODE_ENV=${NODE_ENV}`);
  console.log(`App listening on http://${HOST}:${PORT}`);
})
