import mongoose from "mongoose";

const { Schema } = mongoose;

const commentSchema = new Schema({
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

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;

