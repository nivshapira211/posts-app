import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
    user?: {
        _id: string;
    };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

    if (token == null) {
        res.status(401).send("Access Denied");
        return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        res.status(500).send("Server configuration error");
        return;
    }

    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) {
            res.status(403).send("Invalid Token");
            return;
        }
        req.user = user as { _id: string };
        next();
    });
};

