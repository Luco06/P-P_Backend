import mongoose, { Schema } from "mongoose";
const RecetteSchema = new Schema({
    titre: { type: String, required: true },
    description: { type: String, required: true },
    ingredients: { type: [String], required: true },
    tps_prep: { type: String },
    tps_cook: { type: String },
    nb_person: { type: String },
    dificulty: { type: String, required: true },
    est_public: { type: Boolean, required: true },
    cout: { type: String },
    note: { type: String },
    instructions: { type: [String], required: true },
    categorie: { type: String, required: true },
    img: { type: String },
    favoris: { type: Boolean },
    auteur: { type: Schema.Types.ObjectId, ref: "User", required: true },
    dateCreation: { type: Date, default: Date.now },
    commentaire: [{ type: Schema.Types.ObjectId, ref: "Comment" }]
});
export const Recette = mongoose.model("Recette", RecetteSchema);
