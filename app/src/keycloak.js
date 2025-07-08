import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url: "http://localhost:8080",
  realm: "gabriel-rocha-n3",
  clientId: "frontend",
});

export default keycloak;
