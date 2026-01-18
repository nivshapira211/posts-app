import { Response } from "express";
import Post from "../models/post.js";
import { AuthRequest } from "../middleware/auth.js";

export async function createPost(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { title, body } = req.body;
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const sender = req.user._id;
    const post = await Post.create({ title, body, sender });
    res.status(201).json(post);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function listPosts(req: AuthRequest, res: Response): Promise<void> {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getPost(req: AuthRequest, res: Response): Promise<void> {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(post);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function getPostsBySender(req: AuthRequest, res: Response): Promise<void> {
  try {
    console.log("getPostsBySender called with query:", req.query);
    const { sender } = req.query;
    if (!sender) {
      res.status(400).json({ error: "sender parameter is required" });
      return;
    }
    // Filter posts to only return those created by the specified sender
    const posts = await Post.find({ sender: sender }).sort({ createdAt: -1 });
    res.json(posts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function updatePost(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { title, body } = req.body;
    
    // Find the post and update it, replacing all fields
    const post = await Post.findByIdAndUpdate(
      id,
      { title, body },
      { new: true, runValidators: true }
    );
    
    if (!post) {
      res.status(404).json({ error: "Post not found" });
      return;
    }
    
    res.json(post);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

