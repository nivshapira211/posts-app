import { Request, Response } from "express";
import User from "../models/user.js";
import bcrypt from "bcrypt";
import { AuthRequest } from "../middleware/auth.js";

export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            res.status(400).json({ error: "Username, email, and password are required" });
            return;
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(400).json({ error: "User already exists" });
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

        // Return user without password
        const userResponse = user.toObject();
        delete (userResponse as any).password;
        delete (userResponse as any).refreshTokens;

        res.status(201).json(userResponse);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};

export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const users = await User.find().select("-password -refreshTokens");
        res.json(users);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = await User.findById(req.params.id).select("-password -refreshTokens");
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.json(user);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            req.body.password = await bcrypt.hash(req.body.password, salt);
            // Security: Invalidate existing sessions when password changes
            req.body.refreshTokens = [];
        }
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select("-password -refreshTokens");
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.json(user);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.json({ message: "User deleted successfully" });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

