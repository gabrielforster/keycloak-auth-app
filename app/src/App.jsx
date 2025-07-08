import { useState, useEffect, useMemo } from "react";
import { useKeycloak } from "@react-keycloak/web";
import axios from "axios";

function App() {
  const { keycloak, initialized } = useKeycloak();
  const [data, setData] = useState([]);
  const [form, setForm] = useState({ id: null, name: "", description: "" });

  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: "http://localhost:3000/api/data",
    });
    instance.interceptors.request.use((config) => {
      config.headers.Authorization = `Bearer ${keycloak.token}`;
      return config;
    });
    return instance;
  }, [keycloak.token]);

  const fetchData = async () => {
    const hasRole = keycloak.hasRealmRole("data-read")

    if (hasRole) {
      try {
        const response = await api.get("/");
        setData(response.data);
      } catch (error) {
        console.error("Error details:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          headers: error.response?.headers
        });
        alert("Você não tem permissão para ver os dados.");
      }
    }
  };

  useEffect(() => {
    if (initialized && keycloak.authenticated) {
      fetchData();
    }
  }, [initialized, keycloak.authenticated]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = { name: form.name, description: form.description };

    try {
      if (form.id) {
        await api.put(`/${form.id}`, payload);
      } else {
        await api.post("/", payload);
      }
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Falha ao salvar. Verifique suas permissões.");
    }
  };

  const handleEdit = (item) => {
    setForm(item);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja deletar este item?")) {
      try {
        await api.delete(`/${id}`);
        fetchData();
      } catch (error) {
        console.error("Erro ao deletar:", error);
        alert("Falha ao deletar. Verifique suas permissões.");
      }
    }
  };

  const resetForm = () => {
    setForm({ id: null, name: "", description: "" });
  };

  if (!initialized) {
    return <div>Carregando...</div>;
  }

  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>Sistema de Gerenciamento</h1>
      {!keycloak.authenticated ? (
        <button onClick={() => keycloak.login()}>Login</button>
      ) : (
        <div>
          <p>
            Olá, {keycloak.tokenParsed.preferred_username}! (
            <button onClick={() => keycloak.logout()}>Logout</button>)
          </p>
          <p>
            Suas roles: {keycloak.realmAccess.roles.join(", ")}
          </p>

          {keycloak.hasRealmRole("data-create") ||
          keycloak.hasRealmRole("data-edit") ? (
            <form onSubmit={handleSave} style={{ marginBottom: "2rem" }}>
              <h3>{form.id ? "Editar Item" : "Cadastrar Novo Item"}</h3>
              <input
                type="text"
                name="name"
                placeholder="Nome"
                value={form.name}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="description"
                placeholder="Descrição"
                value={form.description}
                onChange={handleChange}
                required
              />
              <button
                type="submit"
                disabled={
                  form.id
                    ? !keycloak.hasRealmRole("data-edit")
                    : !keycloak.hasRealmRole("data-create")
                }
              >
                {form.id ? "Atualizar" : "Criar"}
              </button>
              {form.id && (
                <button type="button" onClick={resetForm}>
                  Cancelar Edição
                </button>
              )}
            </form>
          ) : (
            <p>Você não tem permissão para criar ou editar itens.</p>
          )}

          <h2>Itens Cadastrados</h2>
          <button onClick={fetchData} disabled={!keycloak.hasRealmRole("data-read")}>
            Atualizar Lista
          </button>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {data.map((item) => (
              <li key={item.id} style={{ border: "1px solid #ccc", padding: "1rem", margin: "0.5rem 0" }}>
                <strong>{item.name}</strong>: {item.description}
                <div style={{ marginTop: "0.5rem" }}>
                  {keycloak.hasRealmRole("data-edit") && (
                    <button onClick={() => handleEdit(item)}>Editar</button>
                  )}
                  {keycloak.hasRealmRole("data-delete") && (
                    <button onClick={() => handleDelete(item.id)}>Deletar</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
