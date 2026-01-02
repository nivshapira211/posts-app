import express from "express";
import * as postsController from "../controllers/postsController.js";

const router = express.Router();

router.get("/", (req, res) => res.send("Hello, World!"));

router.post("/post", postsController.createPost);
router.get("/posts", postsController.listPosts);
// Specific route must come before parameterized route
router.get("/post", postsController.getPostsBySender);
router.get("/post/:id", postsController.getPost);


export default router;
