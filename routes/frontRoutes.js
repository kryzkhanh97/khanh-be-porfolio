const express = require('express');
const router = express.Router();

module.exports = (db) => {

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
                console.error("Lỗi truy vấn SQL:", err);
                return res.status(500).json({ message: "Lỗi Server" });
            }
            res.json(results);
        });
    });

    return router;
};