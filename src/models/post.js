import mongoose from "mongoose";

const { Schema } = mongoose;

const postSchema = new Schema({
  title: { type: String, required: true },
  body: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

const Post = mongoose.model("Post", postSchema);

export default Post;
