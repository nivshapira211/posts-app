import { Response } from "express";
import Comment from "../models/comment.js";
import { AuthRequest } from "../middleware/auth.js";

// Create a new comment
export async function createComment(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { postId, body } = req.body;
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const sender = req.user._id;
    
    if (!postId || !body) {
      res.status(400).json({ 
        error: "postId and body are required" 
      });
      return;
    }
    
    const comment = await Comment.create({ postId, sender, body });
    res.status(201).json(comment);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// Get all comments for a specific post
export async function getCommentsByPost(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { postId } = req.params;
    
    const comments = await Comment.find({ postId })
      .sort({ createdAt: -1 });
    
    res.json(comments);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// Get a single comment by ID
export async function getComment(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const comment = await Comment.findById(id);
    
    if (!comment) {
      res.status(404).json({ error: "Comment not found" });
      return;
    }
    
    res.json(comment);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// Update a comment
export async function updateComment(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { body } = req.body;
    
    const comment = await Comment.findByIdAndUpdate(
      id,
      { body },
      { new: true, runValidators: true }
    );
    
    if (!comment) {
      res.status(404).json({ error: "Comment not found" });
      return;
    }
    
    res.json(comment);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// Delete a comment
export async function deleteComment(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const comment = await Comment.findByIdAndDelete(id);
    
    if (!comment) {
      res.status(404).json({ error: "Comment not found" });
      return;
    }
    
    res.json({ message: "Comment deleted successfully" });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

