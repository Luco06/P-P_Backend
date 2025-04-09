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
import jwt, { JwtPayload } from "jsonwebtoken";
import { User } from "./models/User.js";
import path from "path";
import { fileURLToPath } from "url";

// Setup __dirname pour ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger .env
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const httpServer = http.createServer(app);
const { json } = pkg;

// CORS global
const allowedOrigins = [
  "http://localhost:3000",
  "https://p-pwebapp-production.up.railway.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS Error: Origin ${origin} not allowed.`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(json());

// Connexion Mongo
const connectToDatabase = async () => {
  const dbUrl = process.env.DB_URL;
  if (!dbUrl) throw new Error("DB_URL is not defined in .env");

  try {
    await mongoose.connect(dbUrl);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// Apollo server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

await server.start();

// Middleware GraphQL
app.use(
  "/graphql",
  expressMiddleware(server, {
    context: async ({ req }) => {
      const token = req.headers.authorization || "";
      let user = null;

      try {
        if (token && process.env.SECRET) {
          const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.SECRET);

          if (typeof decoded !== "string") {
            const payload = decoded as JwtPayload;
            if (payload.userID) {
              user = await User.findById(payload.userID);
            }
          }
        }
      } catch (err) {
        console.warn("⚠️ Invalid or expired token");
      }

      return { user };
    },
  })
);

// Start server
const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
});

// Connect DB
await connectToDatabase();
