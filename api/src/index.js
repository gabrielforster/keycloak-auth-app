import express from "express";
import session from "express-session";
import cors from "cors";
import Keycloak from "keycloak-connect";
import setupRoutes from "./routes.js";

const app = express();
app.use(express.json());
app.use(cors());

const memoryStore = new session.MemoryStore();
app.use(
  session({
    secret: "backend-secret",
    resave: false,
    saveUninitialized: true,
    store: memoryStore,
  }),
);

const keycloakConfig = {
  clientId: "backend",
  bearerOnly: true,
  serverUrl: "http://localhost:8080",
  realm: "gabriel-rocha-n3",
  credentials: {
    secret: "backend-secret",
  },
};

const keycloak = new Keycloak({ store: memoryStore }, keycloakConfig);

app.use(
  keycloak.middleware({
    logout: "/logout",
    admin: "/",
  }),
);

app.use("/api/data", setupRoutes(keycloak));

app.use((err, req, res, next) => {
  console.error(`error occurred, path => ${req.path}`, err);
  next()
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`API server is running on port ${PORT}`);
});
