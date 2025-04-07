import { User } from "../models/User.js";
import { Recette } from "../models/Recette.js";
import { Comment as CommentModel } from "../models/Comment.js";
import bcrypt from "bcrypt";
import { GraphQLError } from "graphql";
import Jwt from "jsonwebtoken";
import cloudinary from "../utils/cloudinary.js";
export const resolvers = {
    Query: {
        users: async () => await User.find().populate({
            path: "recettes",
            populate: [
                { path: "auteur", model: "User" },
                {
                    path: "commentaire",
                    populate: { path: "auteur", model: "User" },
                },
            ],
        }),
        user: async (_, { id }) => {
            const user = await User.findById(id)
                .populate({
                path: "recettes",
                populate: [
                    { path: "auteur" },
                    {
                        path: "commentaire",
                        populate: { path: "auteur", model: "User" },
                    },
                ],
            })
                .populate({
                path: "favoris",
                populate: [
                    { path: "auteur" },
                    {
                        path: "commentaire",
                        populate: { path: "auteur", model: "User" },
                    },
                ],
            });
            if (!user) {
                throw new GraphQLError("Utilisateur non trouvé", {
                    extensions: { code: "NOT_FOUND" },
                });
            }
            // Vérifie si le prénom est manquant
            if (!user.prenom) {
                console.error("Prénom manquant pour l'utilisateur:", user);
                throw new GraphQLError("Prénom manquant pour l'utilisateur", {
                    extensions: { code: "INTERNAL_SERVER_ERROR" },
                });
            }
            return user;
        },
        recettes: async () => {
            return await Recette.find()
                .populate("auteur")
                .populate({
                path: "commentaire",
                populate: {
                    path: "auteur",
                    model: "User"
                }
            });
        },
        recette: async (_, { id }) => {
            const recette = await Recette.findById(id).populate("auteur");
            if (!recette) {
                throw new GraphQLError("Recette non trouvée", {
                    extensions: { code: "NOT_FOUND" },
                });
            }
            return recette;
        },
    },
    Mutation: {
        createUser: async (_, { input }) => {
            try {
                const exstingUser = await User.findOne({ email: input.email });
                if (exstingUser) {
                    throw new Error("Cet email est déja utilisé.");
                }
                const hashedPassword = await bcrypt.hash(input.mdp, 10);
                const newUser = new User({ ...input, mdp: hashedPassword });
                await newUser.save();
                return newUser;
            }
            catch (error) {
                console.error("Erreur lors de la création de l'utilisateur:", error);
                throw new Error("Erreur lors de la création de l'utilisateur");
            }
        },
        loginUser: async (_, { email, mdp }) => {
            const user = await User.findOne({ email })
                .populate({
                path: "recettes",
                populate: [
                    { path: "auteur" },
                    {
                        path: "commentaire",
                        populate: { path: "auteur", model: "User" },
                    },
                ],
            })
                .populate({
                path: "favoris",
                populate: [
                    { path: "auteur" },
                    {
                        path: "commentaire",
                        populate: { path: "auteur", model: "User" },
                    },
                ],
            });
            if (!user) {
                console.error("Utilisateur non trouvé pour l'email:", email);
                throw new GraphQLError("Utilisateur non trouvé", {
                    extensions: { code: "NOT_FOUND" },
                });
            }
            const isPasswordValid = await bcrypt.compare(mdp, user.mdp);
            if (!isPasswordValid) {
                console.error("Mot de passe invalide pour l'email:", email);
                throw new GraphQLError("Mot de passe invalide", {
                    extensions: { code: "UNAUTHORIZED" },
                });
            }
            if (!process.env.SECRET) {
                throw new Error("La clé secrète n'est pas définie dans les variables env");
            }
            const token = Jwt.sign({ userID: user.id }, process.env.SECRET, {
                expiresIn: "3h",
            });
            return { token, user: user };
        },
        updateUser: async (_, { id, input }, context) => {
            console.log("User in context:", context.user);
            if (!context.user) {
                throw new GraphQLError("Accès refusé", {
                    extensions: { code: "UNAUTHORIZED" },
                });
            }
            if (context.user._id.toString() !== id) {
                throw new GraphQLError("Accès refusé", {
                    extensions: { code: "UNAUTHORIZED" },
                });
            }
            if (input.avatar) {
                try {
                    const uploadRes = await cloudinary.uploader.upload(input.avatar, {
                        transformation: [
                            { with: 1000, crop: "limit" },
                            { quality: "auto" },
                            { fetch_format: "auto" },
                        ],
                        folder: "avatarUser",
                    });
                    input.avatar = uploadRes.secure_url;
                }
                catch (error) { }
            }
            if (input.mdp) {
                input.mdp = await bcrypt.hash(input.mdp, 10);
            }
            return await User.findByIdAndUpdate(id, { $set: input }, { new: true });
        },
        createRecette: async (_, { input }, context) => {
            if (!context.user) {
                throw new GraphQLError("Authentification requise", {
                    extensions: { code: "UNAUTHENTICATED" },
                });
            }
            if (input.img) {
                try {
                    const uploadRes = await cloudinary.uploader.upload(input.img, {
                        transformation: [
                            { with: 1000, crop: "limit" },
                            { quality: "auto" },
                            { fetch_format: "auto" },
                        ],
                        folder: "imgRecipe",
                    });
                    input.img = uploadRes.secure_url;
                }
                catch (error) { }
            }
            const newRecette = new Recette({ ...input, auteur: context.user._id });
            await newRecette.save();
            await User.findByIdAndUpdate(context.user._id, {
                $push: { recettes: newRecette._id },
            });
            return await Recette.findById(newRecette._id).populate("auteur");
        },
        updateRecette: async (_, { id, input }, context) => {
            if (!context.user) {
                throw new GraphQLError("Authentification requise", {
                    extensions: { code: "UNAUTHENTICATED" },
                });
            }
            const recette = await Recette.findById(id);
            if (!recette) {
                throw new GraphQLError("Recette non trouvée", {
                    extensions: { code: "NOT_FOUND" },
                });
            }
            if (recette.auteur.toString() !== context.user._id.toString()) {
                throw new GraphQLError("Vous ne pouvez modifier que vos propres recettes", { extensions: { code: "UNAUTHORIZED" } });
            }
            if (input.img) {
                try {
                    const uploadRes = await cloudinary.uploader.upload(input.img, {
                        transformation: [
                            { with: 1000, crop: "limit" },
                            { quality: "auto" },
                            { fetch_format: "auto" },
                        ],
                        folder: "imgRecipe",
                    });
                    input.img = uploadRes.secure_url;
                }
                catch (error) { }
            }
            return await Recette.findByIdAndUpdate(id, { $set: input }, { new: true });
        },
        deleteRecette: async (_, { id }, context) => {
            if (!context.user) {
                throw new GraphQLError("Authentification requise", {
                    extensions: { code: "UNAUTHENTICATED" },
                });
            }
            const recette = await Recette.findById(id);
            if (!recette) {
                throw new GraphQLError("Recette non trouvée", {
                    extensions: { code: "NOT_FOUND" },
                });
            }
            if (recette.auteur.toString() !== context.user._id.toString()) {
                throw new GraphQLError("Vous ne pouvez supprimer que vos propres recettes", { extensions: { code: "UNAUTHORIZED" } });
            }
            await Recette.findByIdAndDelete(id);
            await User.findByIdAndUpdate(context.user._id, {
                $pull: { recettes: id },
            });
            return { message: "Recette supprimée avec succès" };
        },
        createComment: async (_, { input }, context) => {
            if (!context.user) {
                throw new GraphQLError("Authentification requise", {
                    extensions: { code: "UNAUTHENTICATED" },
                });
            }
            const newComment = new CommentModel({
                ...input,
                auteur: context.user._id,
            });
            await newComment.save();
            await Recette.findByIdAndUpdate(input.recette, {
                $push: { commentaire: newComment._id },
            });
            return newComment;
        },
        updateComment: async (_, { id, input }, context) => {
            if (!context.user) {
                throw new GraphQLError("Authentification requise", {
                    extensions: { code: "UNAUTHENTICATED" },
                });
            }
            const comment = await CommentModel.findById(id);
            if (!comment) {
                throw new GraphQLError("Commentaire non trouvé", {
                    extensions: { code: "NOT_FOUND" },
                });
            }
            if (comment.auteur.toString() !== context.user._id) {
                throw new GraphQLError("Vous ne pouvez modifier que vos propres commentaires", { extensions: { code: "UNAUTHORIZED" } });
            }
            return await CommentModel.findByIdAndUpdate(id, { $set: input }, { new: true });
        },
        deleteComment: async (_, { id }, context) => {
            if (!context.user) {
                throw new GraphQLError("Authentification requise", {
                    extensions: { code: "UNAUTHENTICATED" },
                });
            }
            const comment = await CommentModel.findById(id);
            if (!comment) {
                throw new GraphQLError("Commentaire non trouvé", {
                    extensions: { code: "NOT_FOUND" },
                });
            }
            if (comment.auteur.toString() !== context.user._id) {
                throw new GraphQLError("Vous ne pouvez supprimer que vos propres commentaires", { extensions: { code: "UNAUTHORIZED" } });
            }
            await CommentModel.findByIdAndDelete(id);
            await Recette.findByIdAndUpdate(comment.recette, {
                $pull: { commentaire: id },
            });
            return { message: "Commentaire supprimé avec succès" };
        },
    },
};
export default resolvers;
