const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();
const app = express();
const path = require('path');


app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Phục vụ ảnh tĩnh - QUAN TRỌNG để React thấy được ảnh
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

const adminRoutes = require('./routes/adminRoutes');
const frontRoutes = require('./routes/frontRoutes');

app.use('/api/admin', adminRoutes(db));
app.use('/api/front', frontRoutes(db));


// Kiểm tra kết nối
db.connect((err) => {
    if (err) {
        console.error('Không thể kết nối MySQL: ' + err.message);
        return;
    }
    console.log('Đã kết nối MySQL thành công!');
});

// API chạy thữ Server
app.get('/api/status', (req, res) => {
    res.json({ message: "Server Node.js đang hoạt động tốt!" });
});


const PORT = process.env.PORT || 5000;
app.listen(5000, () => {
    console.log("Server đang chạy tại cổng: ${PORT}");
});