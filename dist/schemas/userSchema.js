const typeDefs = `#gql
  type User {
    id: ID!
    email: String!
    nom: String!
    prenom: String!
    avatar: String!
    recettes: [Recette]  # 👈 Relation avec les recettes
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Comment {
    id: ID!
    contenu: String!
    auteur: User!  # 👈 Relation avec l'utilisateur qui a écrit le commentaire
    recette: Recette!  # 👈 Relation avec la recette associée
    dateCreation: String!
  }
  
  type Recette {
    id: ID!
    titre: String!
    description: String!
    ingredients: [String]!
    tps_prep: String
    tps_cook: String
    nb_person: String
    dificulty: String!
    est_public: Boolean!
    cout: String
    note: String
    instructions: String!
    categorie: String!
    img: String
    favoris: Boolean
    auteur: User!
    dateCreation: String
    commentaire: [Comment]  # ✅ Corrigé
  }
  
  type Query {
    users: [User]
    user(id: ID!): User
    recettes: [Recette]  
    recette(id: ID!): Recette  
    comments: [Comment]
  }

  input CreateUserInput {
    email: String!
    nom: String!
    prenom: String!
    mdp: String!
    avatar: String
  }

  input UpdateUserInput {
    email: String
    nom: String
    prenom: String
    avatar: String
    mdp: String
  }

  input CreateRecetteInput {
    titre: String!
    description: String!
    ingredients: [String]!
    tps_prep: String
    tps_cook: String
    nb_person: String
    dificulty: String!
    est_public: Boolean!
    cout: String
    note: String
    instructions: String!
    categorie: String!
    img: String
    favoris: Boolean
    auteur: ID!  
  }

  input UpdateRecetteInput {
    titre: String
    description: String
    ingredients: [String]
    tps_prep: String
    tps_cook: String
    nb_person: String
    dificulty: String
    est_public: Boolean
    cout: String
    note: String
    instructions: String
    categorie: String
    img: String
    favoris: Boolean
  }

  input CreateCommentInput {
    contenu: String!
    auteur: ID!  
    recette: ID!  
  }

  input UpdateCommentInput {
    contenu: String
  }

  type Mutation {
    createUser(input: CreateUserInput!): User
    updateUser(id: ID!, input: UpdateUserInput!): User
    loginUser(email: String!, mdp: String!): AuthPayload
    createRecette(input: CreateRecetteInput!): Recette  # 👈 Mutation pour ajouter une recette
    updateRecette(id: ID!, input: UpdateRecetteInput!): Recette
    createComment(input: CreateCommentInput!): Comment
    updateComment(id: ID!, input: UpdateCommentInput!): Comment
    deleteRecette(id: ID!): ResponseMessage  # Mutation pour supprimer une recette
    deleteComment(id: ID!): ResponseMessage
  }
  type ResponseMessage {
    message: String!
}
`;
export default typeDefs;
