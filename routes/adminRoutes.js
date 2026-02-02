const express = require('express');
const router = express.Router();
const md5 = require('md5');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = 'public/uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

module.exports = (db) => {
    
    router.get('/status', (req, res) => {
        res.json({ message: "Server Node.js đang hoạt động tốt!" });
    });

    // API Đăng nhập
    router.post('/login', (req, res) => {
        const { username, password } = req.body;
        const hashedPassword = md5(password);

        const sql = "SELECT * FROM kdd_users WHERE username = ? AND password_hash = ?";
        db.query(sql, [username, hashedPassword], (err, data) => {
            if (err) return res.status(500).json(err);
            if (data.length > 0) {
                return res.json({ message: "Success", user: data[0] });
            } else {
                return res.status(401).json({ message: "Sai tài khoản hoặc mật khẩu" });
            }
        });
    });

    // API nhận file từ Editor
    router.post('/upload-editor', upload.single('file'), (req, res) => {
      if (!req.file) return res.status(400).json({ error: 'Không có file' });
      const location = `http://localhost:5000/uploads/${req.file.filename}`;
      res.json({ location });
    });

    // API lấy tất cả danh mục
    router.get('/getAllCategory', (req, res) => {
        const sql = `SELECT * FROM kdd_categories`;
        db.query(sql, (err, result) => {
            if (err) {
                console.error("Lỗi truy vấn SQL:", err);
                return res.status(500).json({ message: "Lỗi Server"});
            }
            res.json(result);
        })
    });

    // API Tạo danh mục mới
    router.post('/addCategory', (req, res) => {
        const { title, slug ,description } = req.body;
        const sql = `INSERT INTO kdd_categories (title, slug, description, created_at) 
                    VALUES (?, ?, ?, NOW())`;
        db.query(sql, [title, slug, description], (err, result) => {
            if (err) {
                console.error("Lỗi MySQL:", err);
                return res.status(500).json({ message: "Lỗi lưu Database", error: err });
            }
            res.status(200).json({ message: "Thêm danh mục thành công", categoryId: result.insertId });
        });
    });

    // API xóa danh mục theo ID
    router.delete('/deleteCategory/:id', (req, res) => {
        const cateId = req.params.id;
        const sql = `DELETE FROM kdd_categories WHERE id = ?`;

        db.query(sql, [cateId], (err, results) => {
            if (err) {
                console.error("Lỗi truy vấn SQL:", err);
                return res.status(500).json({ message: "Lỗi Server" });
            }
            res.json(results);
        });
    });

    // API lấy tất cả bài viết kèm thông tin liên quan
    router.get('/getAllPost', (req, res) => {
        const sql = `
            SELECT 
                p.*, 
                u.full_name AS author_name,
                c.title AS category_name,
                c.slug AS category_slug
            FROM kdd_posts p
            LEFT JOIN kdd_users u ON p.author_id = u.id
            LEFT JOIN kdd_categories c ON p.category_id = c.id
            WHERE p.status = 'published'
            ORDER BY p.created_at DESC
        `;
        db.query(sql, (err, results) => {
            if (err) {
                console.error("Lỗi MySQL:", err);
                return res.status(500).json({ message: "Lỗi Server" });
            }
            res.json(results);
        });
    });
    
    // API xử lý Table bài viết
    router.get('/getTablePosts', (req, res) => {
        const sql = `
            SELECT p.*, u.full_name AS author_name, c.title AS category_name
            FROM kdd_posts p
            LEFT JOIN kdd_users u ON p.author_id = u.id
            LEFT JOIN kdd_categories c ON p.category_id = c.id
            ORDER BY p.created_at DESC`;

        db.query(sql, (err, results) => {
            if (err) return res.status(500).json(err);
            res.json(results); 
        });
    });

    // API Lấy thông tin chi bài viết bằng ID
    router.get('/getPostByID/:id', (req, res) => {
        const sql = "SELECT * FROM kdd_posts WHERE id = ?";
        db.query(sql, [req.params.id], (err, result) => {
            if (err) return res.status(500).send(err);
            res.json(result[0]); 
        });
    });

    // API Tạo bài viết mới
    router.post('/addPost', upload.single('thumbnail'), (req, res) => {
        const { category_id, author_id, title, slug, summary, content, status } = req.body;
        const thumbnailPath = req.file ? `/uploads/${req.file.filename}` : null;
        const sql = `INSERT INTO kdd_posts (category_id, author_id, title, slug, summary, content, thumbnail, status, published_at, created_at) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;
        db.query(sql, [category_id || null, author_id || 1, title, slug, summary, content, thumbnailPath, status || 'draft'], (err, result) => {
            if (err) {
                console.error("Lỗi MySQL:", err);
                return res.status(500).json({ message: "Lỗi lưu Database", error: err });
            }
            res.status(200).json({ message: "Thêm bài viết thành công", postId: result.insertId });
        });
    });

    // API Cập nhật bài viết
    router.put('/updatePost/:id', (req, res) => {
        const { category_id, author_id, title, slug, summary, content, status } = req.body;
        const thumbnailPath = req.file ? `/uploads/${req.file.filename}` : null;
        const sql = "UPDATE kdd_posts SET category_id = ?, author_id = ?, title = ?, slug = ?, summary = ?, content = ?, thumbnail = ?, status = ?,  updated_at = NOW(), WHERE id = ?";
        
        db.query(sql, [category_id, author_id, title, slug, summary, content, thumbnailPath, status, req.params.id], (err, result) => {
            if (err) return res.status(500).json({ message: "Lỗi cập nhật" });
            res.json({ message: "Cập nhật thành công" });
        });
    });

    // API xóa bài viết theo ID
    router.delete('/deletePost/:id', (req, res) => {
        const postId = req.params.id;
        const sql = `DELETE FROM kdd_posts WHERE id = ?`;

        db.query(sql, [postId], (err, results) => {
            if (err) {
                console.error("Lỗi truy vấn SQL:", err);
                return res.status(500).json({ message: "Lỗi Server" });
            }
            res.json(results);
        });
    });

    return router;
};