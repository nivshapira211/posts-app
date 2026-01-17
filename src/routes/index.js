import express from "express";
import * as postsController from "../controllers/postsController.js";
import * as commentsController from "../controllers/commentsController.js";
import * as authController from "../controllers/authController.js";

const router = express.Router();

router.get("/", (req, res) => res.send("Hello, This is Niv&Ofek posts app!"));

// Auth routes
router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);
router.post("/auth/logout", authController.logout);
router.post("/auth/refresh", authController.refresh);

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
