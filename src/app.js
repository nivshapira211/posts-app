import express from "express";
import Post from "./models/post.js";

export function createApp() {
    const app = express();

    app.use(express.json());

    app.get("/", (req, res) => {
        res.send("Hello, World!");
    });

    // Create post
    app.post("/posts", async (req, res) => {
        try {
            const { title, body } = req.body;
            const post = await Post.create({ title, body });
            res.status(201).json(post);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });


    return app;
}