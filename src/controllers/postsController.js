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

export async function getPost(req, res) {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Not found" });
    res.json(post);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function getPostsBySender(req, res) {
  try {
    console.log("getPostsBySender called with query:", req.query);
    const { sender } = req.query;
    if (!sender) {
      return res.status(400).json({ error: "sender parameter is required" });
    }
    // Filter posts to only return those created by the specified publisher
    const posts = await Post.find({ publisher: sender }).sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

