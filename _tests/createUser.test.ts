import { ApolloServer } from "@apollo/server";
import {gql} from "graphql-tag";
import  typeDefs  from "../src/schemas/userSchema"; 
import  {resolvers}  from "../src/resolvers/userResolver";
import { User } from "../src/models/User";
import bcrypt from "bcrypt"; // N'oublie pas d'importer bcrypt
import {expect, afterAll, beforeAll, describe, it, test, beforeEach} from '@jest/globals';
import { DocumentNode } from "graphql";
import mongoose from "mongoose";
import { jest } from "@jest/globals";
const path = require("path")
const dotenv = require("dotenv")

dotenv.config({path: path.join(__dirname, "../.env")});
jest.setTimeout(30000); // Timeout étendu à 30 secondes

const server = new ApolloServer({ typeDefs, resolvers, formatError: (error)=>{
    return error;
} });

interface TestClient {
    query: (query:string)=> Promise<any>;
    mutate: (mutation:string | DocumentNode)=> Promise<any>;
}

const createTestClient = async (): Promise<TestClient> =>{
    await User.create({
        email:"salutatioooon@gemail.com",
        nom: "Scot",
        prenom: "Eugène",
        mdp: await bcrypt.hash('BoloGazo', 10),
    });
    return {
        query: async(query)=>server.executeOperation({query}),
        mutate: async(mutation)=>server.executeOperation({query: mutation}),
    };
};
describe('Mutation: createUser', () => {
    let testClient: TestClient;
    beforeEach(async () => {
        await User.deleteMany({});
    });
    
    beforeAll(async () => {
        await mongoose.connect(process.env.DB_URL || "");
        testClient = await createTestClient();
    });

    afterAll(async () => {
        await User.deleteMany({});
        await mongoose.connection.close();
    });

    test("devrait pouvoir s'enregistrer", async () => {
        const res = await testClient.mutate(gql`
          mutation {
            createUser(input: { 
                email: "salutatioooon@gemail.com", 
                nom: "Scot", 
                prenom: "Eugène", 
                mdp: "BoloGazo"
    })
    {
    id
    email
    nom
    prenom
  }
  }

        `);

        expect(res.errors).toBeUndefined(); // Vérifiez qu'il n'y a pas d'erreurs
        expect(res).toBeDefined(); // Vérifiez que la réponse est définie

        // Vérifiez les détails de l'utilisateur créé
        expect(res.body.singleResult.data.createUser.email).toBe("salutatioooon@gemail.com");


        // Vérifiez que l'utilisateur a été créé dans la base de données
        const userInDb = await User.findOne({ email: "salutatioooon@gemail.com" });
        expect(userInDb).toBeDefined(); // Vérifiez que l'utilisateur existe dans la DB
    });
});
