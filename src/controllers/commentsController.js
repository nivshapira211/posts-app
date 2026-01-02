import Comment from "../models/comment.js";

// Create a new comment
export async function createComment(req, res) {
  try {
    const { postId, sender, body } = req.body;
    
    if (!postId || !sender || !body) {
      return res.status(400).json({ 
        error: "postId, sender, and body are required" 
      });
    }
    
    const comment = await Comment.create({ postId, sender, body });
    res.status(201).json(comment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Get all comments for a specific post
export async function getCommentsByPost(req, res) {
  try {
    const { postId } = req.params;
    
    const comments = await Comment.find({ postId })
      .sort({ createdAt: -1 });
    
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Get a single comment by ID
export async function getComment(req, res) {
  try {
    const { id } = req.params;
    const comment = await Comment.findById(id);
    
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }
    
    res.json(comment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Update a comment
export async function updateComment(req, res) {
  try {
    const { id } = req.params;
    const { body, sender } = req.body;
    
    const comment = await Comment.findByIdAndUpdate(
      id,
      { body, sender },
      { new: true, runValidators: true }
    );
    
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }
    
    res.json(comment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Delete a comment
export async function deleteComment(req, res) {
  try {
    const { id } = req.params;
    const comment = await Comment.findByIdAndDelete(id);
    
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }
    
    res.json({ message: "Comment deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

