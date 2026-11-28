const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
    createBlog,
    getBlogs,
    getMyBlogs,
    updateBlog,
    deleteBlog
} = require("../controllers/blogController");

// Public route
router.get("/", getBlogs);

// Protected routes
router.get("/me", protect, getMyBlogs);
router.post("/", protect, createBlog);
router.put("/:id", protect, updateBlog);
router.delete("/:id", protect, deleteBlog);

module.exports = router;