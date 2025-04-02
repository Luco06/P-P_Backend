import mongoose, { Schema, Document, Types } from "mongoose";

export interface IComment extends Document {
  contenu: string;
  auteur: Types.ObjectId;
  recette: Types.ObjectId;
  dateCreation: Date;
}

const CommentSchema: Schema = new Schema({
  contenu: { type: String, required: true },
  auteur: { type: Schema.Types.ObjectId, ref: "User", required: true },
  recette: { type: Schema.Types.ObjectId, ref: "Recette", required: true },
  dateCreation: { type: Date, default: Date.now }
});

export const Comment = mongoose.model<IComment>("Comment", CommentSchema);
