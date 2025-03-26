import mongoose, { Schema } from 'mongoose';
const UserSchema = new Schema({
    nom: { type: String, required: true },
    prenom: { type: String, required: true },
    email: { type: String, required: true },
    mdp: { type: String, required: true },
    avatar: String,
    inscriptionDate: { type: Date, default: Date.now },
    recettes: [{ type: Schema.Types.ObjectId, ref: "Recette" }]
});
export const User = mongoose.model('User', UserSchema);
