import mongoose from "mongoose";
import { Recette } from "../models/Recette";
import { User } from "../models/User";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
const migrateFavoris = async () => {
    try {
        await mongoose.connect(process.env.DB_URL || "mongodb://localhost:27017/nomDeTaBDD");
        console.log("🔄 Migration des favoris en cours...");
        // Récupérer toutes les recettes qui ont favoris à true
        const recettesFavorites = await Recette.find({ favoris: true });
        for (const recette of recettesFavorites) {
            // Trouver l'utilisateur qui a créé la recette
            const user = await User.findOne({ recettes: recette._id });
            if (user) {
                // Ajouter cette recette aux favoris de cet utilisateur
                await User.findByIdAndUpdate(user._id, {
                    $addToSet: { favoris: recette._id }
                });
                console.log(`✅ Recette ${recette._id} ajoutée aux favoris de ${user._id}`);
            }
        }
        console.log("🎉 Migration terminée avec succès !");
        mongoose.connection.close();
    }
    catch (error) {
        console.error("❌ Erreur lors de la migration :", error);
        mongoose.connection.close();
    }
};
migrateFavoris();
