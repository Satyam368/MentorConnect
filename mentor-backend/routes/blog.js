const express = require("express");
const router = express.Router();
const {
    createBlog,
    getAllBlogs,
    getBlogById,
    updateBlog,
    deleteBlog,
    likeBlog,
    addComment
} = require("../controllers/blogController");
const authMiddleware = require("../middleware/authMiddleware");

// Public routes (or effectively public since no auth middleware)
router.get("/", getAllBlogs);
router.get("/:id", getBlogById);

// Protected routes (require userId in body)
router.post("/", authMiddleware, createBlog);
router.put("/:id", authMiddleware, updateBlog);
router.delete("/:id", authMiddleware, deleteBlog);
router.post("/:id/like", authMiddleware, likeBlog);
router.post("/:id/comment", authMiddleware, addComment);

module.exports = router;
