import mongoose, {Schema, Document, Types} from "mongoose";

export interface IRecette extends Document {
    titre: string,
    description: string,
    ingredients: string[],
    tps_prep: string,
    tps_cook: string,
    nb_person: string,
    dificulty: string,
    est_public: boolean,
    cout:string,
    note: string,
    instructions: string[],
    categorie: string,
    img: string,
    auteur: Types.ObjectId;
    dateCreation: Date;
    commentaire?: Types.ObjectId,
}

const RecetteSchema: Schema = new Schema({
    titre: {type: String, required: true},
    description:{type: String, required: true},
    ingredients:{type: [String], required: true},
    tps_prep:{type: String },
    tps_cook:{type: String },
    nb_person:{type: String },
    dificulty:{type: String, required: true},
    est_public:{type: Boolean, required: true},
    cout:{type: String},
    note:{type: String},
    instructions: { type: [String], required: true },
    categorie:{type: String, required: true},
    img:{type: String},
    auteur:{type: Schema.Types.ObjectId, ref: "User", required: true},
    dateCreation:{type: Date, default: Date.now},
    commentaire: [{ type: Schema.Types.ObjectId, ref: "Comment" }]

})

export const Recette = mongoose.model<IRecette>("Recette", RecetteSchema);