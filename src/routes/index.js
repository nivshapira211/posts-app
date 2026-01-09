import express from "express";
import * as postsController from "../controllers/postsController.js";
import * as commentsController from "../controllers/commentsController.js";

const router = express.Router();

router.get("/", (req, res) => res.send("Hello, This is Niv&Ofek posts app!"));

// Post routes
router.post("/post", postsController.createPost);
router.get("/posts", postsController.listPosts);
// Specific route must come before parameterized route
router.get("/post", postsController.getPostsBySender);
router.get("/post/:id", postsController.getPost);
router.put("/post/:id", postsController.updatePost);

// Comment routes
router.post("/comment", commentsController.createComment);
router.get("/comment/:id", commentsController.getComment);
router.put("/comment/:id", commentsController.updateComment);
router.delete("/comment/:id", commentsController.deleteComment);
router.get("/post/:postId/comments", commentsController.getCommentsByPost);


export default router;
