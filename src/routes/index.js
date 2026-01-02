import express from "express";
import * as postsController from "../controllers/postsController.js";

const router = express.Router();

router.get("/", (req, res) => res.send("Hello, World!"));

router.post("/posts", postsController.createPost);
router.get("/posts", postsController.listPosts);


export default router;
