import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/user.js";

const generateTokens = (userId) => {
    const accessToken = jwt.sign({ _id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION || "15m" });
    const refreshToken = jwt.sign({ _id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRATION || "7d" });
    return { accessToken, refreshToken };
};

export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).send("Username, email, and password are required");
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send("User already exists");
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({
            username,
            email,
            password: hashedPassword
        });

        await user.save();

        res.status(201).send({
            _id: user._id,
            username: user.username,
            email: user.email
        });
    } catch (err) {
        res.status(400).send(err.message);
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).send("Invalid email or password");

        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) return res.status(400).send("Invalid email or password");

        const tokens = generateTokens(user._id);

        if (!user.refreshTokens) user.refreshTokens = [];
        user.refreshTokens.push(tokens.refreshToken);
        await user.save();

        res.send({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            _id: user._id
        });
    } catch (err) {
        res.status(400).send(err.message);
    }
};

export const logout = async (req, res) => {
    const refreshToken = req.body.refreshToken;
    if (!refreshToken) return res.status(400).send("Refresh Token Required");

    try {
        const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(payload._id);
        
        if (user && user.refreshTokens) {
            user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
            await user.save();
        }
        
        res.send("Logged out successfully");
    } catch (err) {
        res.status(400).send(err.message);
    }
};

export const refresh = async (req, res) => {
    const refreshToken = req.body.refreshToken;
    if (!refreshToken) return res.status(401).send("Refresh Token Required");

    try {
        const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(payload._id);

        if (!user) return res.status(401).send("User not found");

        if (!user.refreshTokens || !user.refreshTokens.includes(refreshToken)) {
            // Token reuse detected or invalid token - clear all tokens for security
            user.refreshTokens = [];
            await user.save();
            return res.status(403).send("Invalid Refresh Token");
        }

        const tokens = generateTokens(user._id);

        // Rotate refresh token: remove old, add new
        user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
        user.refreshTokens.push(tokens.refreshToken);
        await user.save();

        res.send(tokens);
    } catch (err) {
        return res.status(403).send("Invalid Refresh Token");
    }
};