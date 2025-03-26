import mongoose, { Schema } from "mongoose";
const CommentSchema = new Schema({
    contenu: { type: String, required: true },
    auteur: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recette: { type: Schema.Types.ObjectId, ref: "Recette", required: true },
    dateCreation: { type: Date, default: Date.now }
});
export const Comment = mongoose.model("Comment", CommentSchema);
