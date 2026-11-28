const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const blogRoutes = require("./routes/blogRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// API routes
app.get("/", (req, res) => {
    res.json({
        message: "Blogging Platform API is running!"
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/blogs", blogRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        message: "Route not found"
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err);

    res.status(err.status || 500).json({
        message: err.status ? err.message : "Internal server error"
    });
});

const startServer = async () => {
    try {
        await connectDB();

        const PORT = process.env.PORT || 5000;

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
};

startServer();