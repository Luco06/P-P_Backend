import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import express from "express";
import typeDefs from "./schemas/userSchema.js";
import { resolvers } from "./resolvers/userResolver.js";
import http from "http";
import cors from "cors";
import pkg from "body-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import  Jwt  from "jsonwebtoken";
import { User } from "./models/User.js";
import path from "path";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const httpServer = http.createServer(app);
const { json } = pkg;

// Connexion à MongoDB
const connectToDatabase = async () => {
  const dbUrl = process.env.DB_URL; // Assurez-vous que DB_URL est défini dans .env
  if (!dbUrl) {
    throw new Error("DB_URL is not defined in .env");
  }

  try {
    await mongoose.connect(dbUrl, {
    });
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error);
    process.exit(1); // Quitter le processus si la connexion échoue
  }
};

// Création du serveur Apollo
const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });
  

await server.start();
const allowedOrigins = process.env.CORS_ORIGIN?.split(",") || [];
// Middleware pour gérer les CORS et les requêtes
app.use(
  "/graphql",
  cors({
    origin: ["http://localhost:3000","https://p-pwebapp-production.up.railway.app" ], 
    methods: ["GET", "POST", "OPTIONS"], // Méthodes autorisées
    allowedHeaders: ["Content-Type", "Authorization"], // En-têtes autorisés
    credentials: true,
  }),
  json(),
  expressMiddleware(server, {
    context: async ({ req }) => {
        const token = req.headers.authorization || "";
        let user = null;
        if (!process.env.SECRET){
          throw new Error( "La clé secrète n'est pas définie dans les variables env")
        }
      if (token){
          try {
              const decoded: any = Jwt.verify(
                  token.replace("Bearer ", ""), process.env.SECRET
              );
              user = await User.findById(decoded.userID)
              console.log(token)
              console.log("Decoded userID:", decoded.userID);
          } catch (error) {
            console.warn("Token invalide ou expiré");
          }
        }
    
        return { user }; // Si user est null, cela signifie que l'utilisateur n'est pas authentifié
      },
  })
);

// Démarrer le serveur
await new Promise<void>((resolve) =>
  httpServer.listen({ port: 4000 }, resolve)
);

console.log("🚀 Server ready at http://localhost:4000/graphql");

// Connexion à la base de données
await connectToDatabase();
