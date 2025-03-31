interface UserInput {
  email: string;
  nom: string;
  prenom: string;
  avatar: string;
  mdp:string;
  recettes: any[];
}

interface RecetteInput {
  titre: string;
  description: string;
  ingredients: any[];
  tps_prep: string;
  tps_cook: string;
  nb_person: string;
  dificulty: string;
  est_public: Boolean;
  cout: string;
  note: string;
  instructions: string;
  categorie: string;
  img: string;
  favoris: Boolean;
  auteur: string;
  dateCreation: string;
  commentaire: any[]; 
}

interface Context {
  user?: any; // Définit le type approprié pour l'utilisateur
}

interface CommentInput { // Interface pour l'entrée des commentaires
  contenu: string; // Assurez-vous de définir les champs corrects selon votre modèle
  recette: string; // ID de la recette associée
}


import { User } from "../models/User.js";
import { Recette } from "../models/Recette.js";
import { Comment as CommentModel } from "../models/Comment.js"; 
import bcrypt from "bcrypt"
import { GraphQLError } from "graphql";
import  Jwt  from "jsonwebtoken";
import cloudinary from "../utils/cloudinary.js";
import { IRecette } from "../models/Recette.js";
export const resolvers = {
  Query: {
    users: async () => await User.find().populate("recettes"),
    user: async (_: unknown, { id }: {id: string}) => await User.findById(id).populate("recettes"),
    recettes: async () => await Recette.find().populate("auteur"),
    recette: async (_: unknown, { id }: {id: string}) => {
      const recette = await Recette.findById(id).populate("auteur")
      if(!recette){
        throw new GraphQLError("Recette non trouvée", {
          extensions: {code: "NOT_FOUND"}
        });
      }
      return recette;
    }
  },
  Mutation: {
    createUser: async (_: unknown,  { input }: {input: UserInput})=>{
      try {
        const exstingUser= await User.findOne({email: input.email});
        if(exstingUser){
          throw new Error ("Cet email est déja utilisé.")
        }
        const hashedPassword = await bcrypt.hash(input.mdp, 10);
        const newUser = new User({...input,
          mdp: hashedPassword,
        });
        await newUser.save();
        return newUser;
      }catch (error){
        console.error("Erreur lors de la création de l'utilisateur:", error); 
        throw new Error("Erreur lors de la création de l'utilisateur");
      }
  
    },
    loginUser: async (_: unknown, { email, mdp }: { email: string; mdp: string }) => {
      const user = await User.findOne({ email }).populate("recettes");
      if (!user) {
          console.error("Utilisateur non trouvé pour l'email:", email);
          throw new GraphQLError("utilisateur non trouvé", {
              extensions: { code: 'NOT_FOUND' },
          });
      }
      const isPasswordValid = await bcrypt.compare(mdp, user.mdp);
      if (!isPasswordValid) {
          console.error("Mot de passe invalide pour l'email:", email);
          throw new GraphQLError("Mot de passe invalide", {
              extensions: { code: 'UNAUTHORIZED' },
          });
      }  
      if (!process.env.SECRET){
        throw new Error( "La clé secrète n'est pas définie dans les variables env")
      }
      const token = Jwt.sign({userID: user.id}, process.env.SECRET,{expiresIn: "3h"})
      return {token, user}
    },
    updateUser: async(_:unknown, {id, input}: {id:string; input: Partial<UserInput>}, context: any)=>{
      console.log("User in context:", context.user);
      if (!context.user){
        throw new GraphQLError("Accès refusé", {extensions: {code: "UNAUTHORIZED"}});
      }
      if (context.user._id.toString() !== id) {
        throw new GraphQLError("Accès refusé", { extensions: { code: "UNAUTHORIZED" } });
      }
      if(input.avatar){
        try {
          const uploadRes = await cloudinary.uploader.upload(input.avatar, {
            transformation: [
              {with: 1000, crop: "limit"},
              {quality: "auto"},
              {fetch_format: "auto"}
            ],
            folder: "avatarUser"
          });
          input.avatar = uploadRes.secure_url;
        } catch (error) {
          
        }
      }
      if (input.mdp){
        input.mdp = await bcrypt.hash(input.mdp,10)
      }
      return await User.findByIdAndUpdate(id, {$set: input}, {new: true});
    },
    createRecette: async (_: unknown,  { input }:{input: any}, context: any) => {
      if (!context.user){
        throw new GraphQLError("Authentification requise", {
          extensions:{ code: 'UNAUTHENTICATED'}
        });
        
      }
      const newRecette = new Recette({...input, auteur: context.user._id,});
      await newRecette.save();

      // Ajouter la recette à l'utilisateur
      await User.findByIdAndUpdate(context.user._id, { $push: { recettes: newRecette._id } });

    return await Recette.findById(newRecette._id).populate("auteur")
    },
    updateRecette: async (_: unknown, { id, input }: { id: string; input: Partial<RecetteInput> }, context: any) => {
      if (!context.user) {
        throw new GraphQLError("Authentification requise", { extensions: { code: "UNAUTHENTICATED" } });
      }
      const recette = await Recette.findById(id);
      if (!recette) {
        throw new GraphQLError("Recette non trouvée", { extensions: { code: "NOT_FOUND" } });
      }
      if (recette.auteur.toString() !== context.user._id.toString()) {
        throw new GraphQLError("Vous ne pouvez modifier que vos propres recettes", { extensions: { code: "UNAUTHORIZED" } });
      }
      if(input.img){
        try {
          const uploadRes = await cloudinary.uploader.upload(input.img, {
            transformation: [
              {with: 1000, crop: "limit"},
              {quality: "auto"},
              {fetch_format: "auto"}
            ],
            folder: "avatarUser"
          });
          input.img = uploadRes.secure_url;
        } catch (error) {
          
        }
      }
      return await Recette.findByIdAndUpdate(id, { $set: input }, { new: true });
    },
    deleteRecette: async (_: unknown, { id }: { id: string }, context: any) => {
      if (!context.user) {
          throw new GraphQLError("Authentification requise", { extensions: { code: "UNAUTHENTICATED" } });
      }

      const recette = await Recette.findById(id);
      if (!recette) {
          throw new GraphQLError("Recette non trouvée", { extensions: { code: "NOT_FOUND" } });
      }

      // Vérifie si l'utilisateur est l'auteur de la recette
      if (recette.auteur.toString() !== context.user._id.toString()) {
          throw new GraphQLError("Vous ne pouvez supprimer que vos propres recettes", { extensions: { code: "UNAUTHORIZED" } });
      }

      // Supprimer la recette de la base de données
      await Recette.findByIdAndDelete(id);

      // Optionnel : retirer l'ID de la recette du tableau 'recettes' de l'utilisateur
      await User.findByIdAndUpdate(context.user._id, { $pull: { recettes: id } });

      return { message: "Recette supprimée avec succès" }; // Message de succès
  },
    createComment: async (_: unknown, { input }: { input: CommentInput }, context: any) => {
      if (!context.user) {
        throw new GraphQLError("Authentification requise", { extensions: { code: "UNAUTHENTICATED" } });
      }
      const newComment = new CommentModel({ ...input, auteur: context.user._id });
      await newComment.save();
      await Recette.findByIdAndUpdate(input.recette, { $push: { commentaire: newComment._id } });
      return newComment;
    },
    updateComment: async (_: unknown, { id, input }: { id: string; input: Partial<CommentInput> }, context: any) => {
      if (!context.user) {
        throw new GraphQLError("Authentification requise", { extensions: { code: "UNAUTHENTICATED" } });
      }
      const comment = await CommentModel.findById(id);
      if (!comment) {
        throw new GraphQLError("Commentaire non trouvé", { extensions: { code: "NOT_FOUND" } });
      }
      if (comment.auteur.toString() !== context.user._id) {
        throw new GraphQLError("Vous ne pouvez modifier que vos propres commentaires", { extensions: { code: "UNAUTHORIZED" } });
      }
      return await CommentModel.findByIdAndUpdate(id, { $set: input }, { new: true });
    },
    // Dans tes résolveurs...
deleteComment: async (_: unknown, { id }: { id: string }, context: any) => {
  if (!context.user) {
      throw new GraphQLError("Authentification requise", { extensions: { code: "UNAUTHENTICATED" } });
  }

  const comment = await CommentModel.findById(id);
  if (!comment) {
      throw new GraphQLError("Commentaire non trouvé", { extensions: { code: "NOT_FOUND" } });
  }

  // Vérifie si l'utilisateur est l'auteur du commentaire
  if (comment.auteur.toString() !== context.user._id) {
      throw new GraphQLError("Vous ne pouvez supprimer que vos propres commentaires", { extensions: { code: "UNAUTHORIZED" } });
  }

  // Supprimer le commentaire de la base de données
  await CommentModel.findByIdAndDelete(id);

  // Optionnel : retirer l'ID du commentaire de la recette associée
  await Recette.findByIdAndUpdate(comment.recette, { $pull: { commentaire: id } });

  return { message: "Commentaire supprimé avec succès" }; // Message de succès
},

  },
};

export default resolvers;
