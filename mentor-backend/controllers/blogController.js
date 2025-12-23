const Blog = require("../models/Blog");
const User = require("../models/User");

// Create a new blog post
exports.createBlog = async (req, res) => {
    try {
        const { title, content, excerpt, category, tags, coverImage, authorId } = req.body;

        if (!authorId) {
            return res.status(400).json({ message: "Author ID is required" });
        }

        const newBlog = new Blog({
            title,
            content,
            excerpt: excerpt || content.substring(0, 150) + "...",
            author: authorId,
            category,
            tags,
            coverImage
        });

        const savedBlog = await newBlog.save();
        res.status(201).json(savedBlog);
    } catch (err) {
        console.error("Error creating blog:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// Get all blog posts with pagination and filtering
exports.getAllBlogs = async (req, res) => {
    try {
        const { page = 1, limit = 10, category, search, author } = req.query;

        const query = { isPublished: true };

        if (category && category !== 'all') {
            query.category = category;
        }

        if (author) {
            query.author = author;
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        const blogs = await Blog.find(query)
            .populate("author", "name profilePicture bio role")
            .sort({ publishedAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Blog.countDocuments(query);

        res.json({
            blogs,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (err) {
        console.error("Error fetching blogs:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// Get a single blog post by ID
exports.getBlogById = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id)
            .populate("author", "name profilePicture bio role")
            .populate("comments.user", "name profilePicture");

        if (!blog) {
            return res.status(404).json({ message: "Blog post not found" });
        }

        // Increment views
        blog.views += 1;
        await blog.save();

        res.json(blog);
    } catch (err) {
        console.error("Error fetching blog:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// Update a blog post
exports.updateBlog = async (req, res) => {
    try {
        const { userId } = req.body;
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({ message: "Blog post not found" });
        }

        // Check ownership
        if (userId && blog.author.toString() !== userId) {
            return res.status(403).json({ message: "Not authorized to update this post" });
        }

        const updatedBlog = await Blog.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );

        res.json(updatedBlog);
    } catch (err) {
        console.error("Error updating blog:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// Delete a blog post
exports.deleteBlog = async (req, res) => {
    try {
        const { userId } = req.body; // Expect userId in body for verification
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({ message: "Blog post not found" });
        }

        // Check ownership
        if (userId && blog.author.toString() !== userId) {
            return res.status(403).json({ message: "Not authorized to delete this post" });
        }

        await Blog.findByIdAndDelete(req.params.id);
        res.json({ message: "Blog post deleted successfully" });
    } catch (err) {
        console.error("Error deleting blog:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// Like/Unlike a blog post
exports.likeBlog = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({ message: "Blog post not found" });
        }

        const index = blog.likes.indexOf(userId);

        if (index === -1) {
            // Like
            blog.likes.push(userId);
        } else {
            // Unlike
            blog.likes.splice(index, 1);
        }

        await blog.save();
        res.json(blog.likes);
    } catch (err) {
        console.error("Error liking blog:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// Add a comment
exports.addComment = async (req, res) => {
    try {
        const { content, userId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({ message: "Blog post not found" });
        }

        const newComment = {
            user: userId,
            content,
            createdAt: new Date()
        };

        blog.comments.unshift(newComment);
        await blog.save();

        // Populate user info for the new comment to return it
        const populatedBlog = await Blog.findById(req.params.id).populate("comments.user", "name profilePicture");

        res.json(populatedBlog.comments);
    } catch (err) {
        console.error("Error adding comment:", err);
        res.status(500).json({ message: "Server error" });
    }
};
