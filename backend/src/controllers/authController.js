const User = require("../models/User");
const jwt = require("jsonwebtoken");

const generateToken = (id) => {
    return jwt.sign(
        { id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );
};

// REGISTER
exports.register = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            message: "All fields are required"
        });
    }

    if (password.length < 8) {
        return res.status(400).json({
            message: "Password must be at least 8 characters"
        });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
        return res.status(409).json({
            message: "Email already registered"
        });
    }

    const user = await User.create({
        name,
        email,
        password
    });

    res.status(201).json({
        message: "Registration successful",
        token: generateToken(user._id),
        user: {
            id: user._id,
            name: user.name,
            email: user.email
        }
    });
};

// LOGIN
exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required"
        });
    }

    const user = await User.findOne({
        email: email.toLowerCase()
    }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({
            message: "Invalid email or password"
        });
    }

    res.status(200).json({
        message: "Login successful",
        token: generateToken(user._id),
        user: {
            id: user._id,
            name: user.name,
            email: user.email
        }
    });
};