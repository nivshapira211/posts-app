import mongoose, { Document, Schema } from "mongoose";

export interface IComment extends Document {
    postId: mongoose.Types.ObjectId;
    sender: string;
    body: string;
    createdAt: Date;
}

const commentSchema = new Schema<IComment>({
    postId: { 
        type: Schema.Types.ObjectId, 
        ref: "Post", 
        required: true 
    },
    sender: { 
        type: String, 
        required: true 
    },
    body: { 
        type: String, 
        required: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
});

const Comment = mongoose.model<IComment>("Comment", commentSchema);
export default Comment;

