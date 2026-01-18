import mongoose, { Document, Schema } from "mongoose";

export interface IPost extends Document {
    title: string;
    body: string;
    sender: string;
    createdAt: Date;
}

const postSchema = new Schema<IPost>({
    title: { type: String, required: true },
    body: { type: String, default: "" },
    sender: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

const Post = mongoose.model<IPost>("Post", postSchema);
export default Post;

