import Post from "../models/post.js";

export async function createPost(req, res) {
  try {
    const { title, body, publisher } = req.body;
    const post = await Post.create({ title, body, publisher });
    res.status(201).json(post);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function listPosts(req, res) {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

