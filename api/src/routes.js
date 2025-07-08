// @ts-check
import { Router } from "express";
import Keycloak from "keycloak-connect";

let dataStore = [
  { id: 1, name: "Item Inicial", description: "Este item já existia." },
];
let nextId = 2;

/**
 * @param {Keycloak.Keycloak} keycloak - Keycloak instance for authentication and authorization
*/
export default function setupRoutes(keycloak) {
  const router = Router();

  router.get(
    "/",
    keycloak.protect("realm:data-read"),
    (_, res) => {
      res.json(dataStore);
    },
  );

  router.post(
    "/",
    keycloak.protect("realm:data-create"),
    (req, res) => {
      const newItem = { id: nextId++, ...req.body };
      dataStore.push(newItem);
      res.status(201).json(newItem);
    },
  );

  router.put(
    "/:id",
    keycloak.protect("realm:data-edit"),
    (req, res) => {
      const { id } = req.params;
      const index = dataStore.findIndex((item) => item.id == Number(id));
      if (index === -1) {
        res.status(404).json({ message: "Item não encontrado" });
        return
      }
      dataStore[index] = { ...dataStore[index], ...req.body };
      res.json(dataStore[index]);
    },
  );

  router.delete(
    "/:id",
    keycloak.protect("realm:data-delete"),
    (req, res) => {
      const { id } = req.params;
      const initialLength = dataStore.length;
      dataStore = dataStore.filter((item) => item.id != Number(id));
      if (dataStore.length === initialLength) {
        res.status(404).json({ message: "Item não encontrado" });
        return
      }
      res.status(204).send();
    },
  );

  return router;
}
