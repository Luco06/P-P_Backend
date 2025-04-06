import mongoose, { Schema } from "mongoose";
const CommentSchema = new Schema({
    contenu: { type: String, required: true },
    auteur: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recette: { type: Schema.Types.ObjectId, ref: "Recette", required: true },
    dateCreation: { type: Date, default: Date.now }
}, {
    toJSON: {
        virtuals: true,
        transform: function (_doc, ret) {
            ret.id = ret._id.toString(); // Conversion ici
            delete ret._id;
            delete ret.__v;
        }
    },
    toObject: {
        virtuals: true,
        transform: function (_doc, ret) {
            ret.id = ret._id.toString(); // Conversion ici
            delete ret._id;
            delete ret.__v;
        }
    }
});
export const Comment = mongoose.model("Comment", CommentSchema);
