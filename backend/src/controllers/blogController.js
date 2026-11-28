const Blog = require("../models/Blog");

// CREATE BLOG
exports.createBlog = async (req, res) => {
    const { title, content, category, status } = req.body;

    if (!title || !content) {
        return res.status(400).json({
            message: "Title and content are required"
        });
    }

    const blog = await Blog.create({
        title,
        content,
        category,
        status,
        author: req.user._id
    });

    res.status(201).json({
        message: "Blog created successfully",
        blog
    });
};

// GET ALL PUBLISHED BLOGS
exports.getBlogs = async (req, res) => {
    const blogs = await Blog.find({ status: "published" })
        .populate("author", "name")
        .sort({ createdAt: -1 });

    res.json(blogs);
};

// GET LOGGED-IN USER'S BLOGS
exports.getMyBlogs = async (req, res) => {
    const blogs = await Blog.find({
        author: req.user._id
    }).sort({ createdAt: -1 });

    res.json(blogs);
};

// UPDATE BLOG
exports.updateBlog = async (req, res) => {
    const blog = await Blog.findOne({
        _id: req.params.id,
        author: req.user._id
    });

    if (!blog) {
        return res.status(404).json({
            message: "Blog not found"
        });
    }

    const { title, content, category, status } = req.body;

    if (title !== undefined) blog.title = title;
    if (content !== undefined) blog.content = content;
    if (category !== undefined) blog.category = category;
    if (status !== undefined) blog.status = status;

    await blog.save();

    res.json({
        message: "Blog updated successfully",
        blog
    });
};

// DELETE BLOG
exports.deleteBlog = async (req, res) => {
    const blog = await Blog.findOne({
        _id: req.params.id,
        author: req.user._id
    });

    if (!blog) {
        return res.status(404).json({
            message: "Blog not found"
        });
    }

    await blog.deleteOne();

    res.json({
        message: "Blog deleted successfully"
    });
};