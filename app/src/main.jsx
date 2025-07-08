import React from "react";
import ReactDOM from "react-dom/client";
import { ReactKeycloakProvider } from "@react-keycloak/web";
import App from "./App.jsx";
import keycloak from "./keycloak.js";

ReactDOM.createRoot(document.getElementById("root")).render(
  <ReactKeycloakProvider authClient={keycloak}>
    <App />
  </ReactKeycloakProvider>
);
