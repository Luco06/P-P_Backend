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
import jwt from "jsonwebtoken"; // Assurez-vous d'importer JwtPayload
import { User } from "./models/User.js";
import path from "path";
import { fileURLToPath } from "url";
// Setup __dirname pour ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Charger les variables d'environnement
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
        await mongoose.connect(dbUrl);
        console.log("✅ Connected to MongoDB");
    }
    catch (error) {
        console.error("❌ Error connecting to MongoDB:", error);
        process.exit(1); // Quitter le processus si la connexion échoue
    }
};
// Middleware CORS
const allowedOrigins = [
    "http://localhost:3000",
    "https://p-pwebapp-production.up.railway.app"
];
app.use(cors({
    origin: (origin, callback) => {
        // Vérifie si l'origine est autorisée
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error(`CORS Error: Origin ${origin} not allowed.`));
        }
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
}));
// Parser JSON
app.use(json());
// Création du serveur Apollo
const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});
await server.start();
// Middleware GraphQL
app.use("/graphql", expressMiddleware(server, {
    context: async ({ req }) => {
        const token = req.headers.authorization || "";
        let user = null;
        if (!process.env.SECRET) {
            throw new Error("La clé secrète n'est pas définie dans les variables env");
        }
        if (token) {
            try {
                const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.SECRET);
                if (decoded.userID) { // Assurez-vous que userID existe sur le payload
                    user = await User.findById(decoded.userID);
                    console.log("Decoded userID:", decoded.userID);
                }
            }
            catch (error) {
                console.warn("⚠️ Token invalide ou expiré");
            }
        }
        return { user }; // Si user est null, cela signifie que l'utilisateur n'est pas authentifié
    },
}));
// Démarrer le serveur
const PORT = process.env.PORT || 4000;
await new Promise((resolve) => {
    httpServer.listen({ port: PORT }, resolve);
});
console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
// Connexion à la base de données
await connectToDatabase();
