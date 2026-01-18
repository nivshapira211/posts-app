import { Request, Response } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/user.js";

interface TokenPayload {
    _id: string;
}

const generateTokens = (userId: string): { accessToken: string; refreshToken: string } => {
    const jwtSecret = process.env.JWT_SECRET || "";
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || "";
    const payload = { _id: userId };
    const accessToken = jwt.sign(payload, jwtSecret, { expiresIn: process.env.JWT_EXPIRATION || "15m" } as SignOptions);
    const refreshToken = jwt.sign(payload, jwtRefreshSecret, { expiresIn: process.env.JWT_REFRESH_EXPIRATION || "7d" } as SignOptions);
    return { accessToken, refreshToken };
};

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            res.status(400).send({ error: "Username, email, and password are required" });
            return;
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(400).send({ error: "User already exists" });
            return;
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
    } catch (err: any) {
        res.status(400).send({ error: err.message });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            res.status(400).send({ error: "Invalid email or password" });
            return;
        }

        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) {
            res.status(400).send({ error: "Invalid email or password" });
            return;
        }

        const tokens = generateTokens(user._id.toString());

        if (!user.refreshTokens) user.refreshTokens = [];
        user.refreshTokens.push(tokens.refreshToken);
        await user.save();

        res.send({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            _id: user._id
        });
    } catch (err: any) {
        res.status(400).send({ error: err.message });
    }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
    const refreshToken = req.body.refreshToken;
    if (!refreshToken) {
        res.status(400).send({ error: "Refresh Token Required" });
        return;
    }

    try {
        const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || "";
        const payload = jwt.verify(refreshToken, jwtRefreshSecret) as TokenPayload;
        const user = await User.findById(payload._id);
        
        if (user && user.refreshTokens) {
            user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
            await user.save();
        }
        
        res.send("Logged out successfully");
    } catch (err: any) {
        res.status(400).send({ error: err.message });
    }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
    const refreshToken = req.body.refreshToken;
    if (!refreshToken) {
        res.status(401).send({ error: "Refresh Token Required" });
        return;
    }

    try {
        const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || "";
        const payload = jwt.verify(refreshToken, jwtRefreshSecret) as TokenPayload;
        const user = await User.findById(payload._id);

        if (!user) {
            res.status(401).send({ error: "User not found" });
            return;
        }

        if (!user.refreshTokens || !user.refreshTokens.includes(refreshToken)) {
            // Token reuse detected or invalid token - clear all tokens for security
            user.refreshTokens = [];
            await user.save();
            res.status(403).send({ error: "Invalid Refresh Token" });
            return;
        }

        const tokens = generateTokens(user._id.toString());

        // Rotate refresh token: remove old, add new
        user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
        user.refreshTokens.push(tokens.refreshToken);
        await user.save();

        res.send(tokens);
    } catch (err: any) {
        res.status(403).send({ error: "Invalid Refresh Token" });
    }
};

