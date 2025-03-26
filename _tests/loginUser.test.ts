import { ApolloServer } from "@apollo/server";
import {gql} from "graphql-tag";
import  typeDefs  from "../src/schemas/userSchema"; 
import  {resolvers}  from "../src/resolvers/userResolver";
import { User } from "../src/models/User";
import bcrypt from "bcrypt"; // N'oublie pas d'importer bcrypt
import {expect, afterAll, beforeAll, describe, it, test} from '@jest/globals';
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
        email:"salutation@gemail.com",
        nom: "Bob",
        prenom: "Marley",
        mdp: await bcrypt.hash('BoloGazo', 10),
    });

    return {
        query: async (query) =>server.executeOperation({query}),
        mutate: async (mutation)=> server.executeOperation({ query: mutation}),
    };
};

describe( 'Mutation: loginUser', ()=>{
    let testClient: TestClient;
    
    beforeAll(async ()=> {
        await mongoose.connect(process.env.DB_URL|| "");
        testClient = await createTestClient();
    });

    afterAll(async () => {
        await User.deleteMany({});
        await mongoose.connection.close();
    });    
    test("devrait se connecter avec des informations valides", async () => {
        const res = await testClient.mutate(gql`
            mutation {
                loginUser(email: "salutation@gemail.com", mdp: "BoloGazo") {
                    token
                    user {
                        email
                 
                    }
                }
            }
        `);
        expect(res.errors).toBeUndefined(); // Vérifiez qu'il n'y a pas d'erreurs
        expect(res).toBeDefined();
        expect(res.body.singleResult.data.loginUser.user.email).toBe('salutation@gemail.com'); // Vérifiez l'email
    });
    
    test('Devrait retourner une erreur pour un email invalide', async () => {
        const res = await testClient.mutate(gql`
            mutation {
                loginUser(email: "wrong@exemple.com", mdp: "password") {
                    token 
                    user {
                        email
                    }
                }
            }
        `);
        expect(res).toBeDefined();
        expect(res.body.singleResult.errors[0].message).toBe('utilisateur non trouvé');
    });
    
    test('Devrait retourner une erreur pour un mot de passe invalide', async () => {
        const res = await testClient.mutate(gql`
            mutation {
                loginUser(email: "salutation@gemail.com", mdp: "wrongpassword") {
                    token
                    user {
                        email
                    }
                }
            }
        `);
        expect(res.body.singleResult.errors[0].message).toBeDefined();
        expect(res.body.singleResult.errors[0].message).toBe('Mot de passe invalide');
    });    
    });


