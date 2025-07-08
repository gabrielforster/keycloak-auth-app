import { useState, useEffect, useMemo } from "react";
import { useKeycloak } from "@react-keycloak/web";
import axios from "axios";

function App() {
  const { keycloak, initialized } = useKeycloak();
  const [data, setData] = useState([]);
  const [form, setForm] = useState({ id: null, name: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

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
    const hasRole = keycloak.hasRealmRole("data-read");

    if (hasRole) {
      setLoading(true);
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
      } finally {
        setLoading(false);
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

    setSaving(true);
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
    } finally {
      setSaving(false);
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
    return (
      <div className="container" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="card text-center">
          <div className="loading-icon pulse">⏳</div>
          <h2>Carregando...</h2>
          <p>Inicializando o sistema</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <header className="app-header">
        <div className="container">
          <div>
            <h1 className="app-title">Sistema de Gerenciamento</h1>
            <p className="app-subtitle">Controle de dados com autenticação Keycloak</p>
          </div>
          {keycloak.authenticated && (
            <div className="user-info">
              <p className="user-greeting">
                👋 Olá, {keycloak.tokenParsed.preferred_username}!
              </p>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => keycloak.logout()}
              >
                🚪 Sair
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="container">
        {!keycloak.authenticated ? (
          /* Login Section */
          <div className="login-section">
            <div className="card text-center">
              <div className="login-icon">🔐</div>
              <h2 className="mb-4">Acesso ao Sistema</h2>
              <p className="mb-6">
                Faça login para acessar o sistema de gerenciamento
              </p>
              <button
                onClick={() => keycloak.login()}
                className="btn btn-success btn-lg"
              >
                🔑 Fazer Login
              </button>
            </div>
          </div>
        ) : (
          <div className="slide-in">
            {/* User Info Card */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">👤 Informações do Usuário</h3>
              </div>
              <div className="user-info-grid">
                <div className="user-info-item">
                  <div className="user-info-label">Nome de Usuário</div>
                  <div className="user-info-value">{keycloak.tokenParsed.preferred_username}</div>
                </div>
                <div className="user-info-item">
                  <div className="user-info-label">Email</div>
                  <div className="user-info-value">{keycloak.tokenParsed.email}</div>
                </div>
                <div className="user-info-item">
                  <div className="user-info-label">Permissões</div>
                  <div className="role-badges">
                    {keycloak.realmAccess.roles.map((role) => (
                      <span key={role} className="role-badge">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Form Section */}
            {(keycloak.hasRealmRole("data-create") || keycloak.hasRealmRole("data-edit")) && (
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">
                    {form.id ? "✏️ Editar Item" : "➕ Cadastrar Novo Item"}
                  </h3>
                </div>
                <form onSubmit={handleSave}>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Nome *</label>
                      <input
                        type="text"
                        name="name"
                        className="form-input"
                        placeholder="Digite o nome do item"
                        value={form.name}
                        onChange={handleChange}
                        required
                        disabled={saving}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Descrição *</label>
                      <textarea
                        name="description"
                        className="form-textarea"
                        placeholder="Digite a descrição do item"
                        value={form.description}
                        onChange={handleChange}
                        required
                        disabled={saving}
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button
                      type="submit"
                      className={`btn ${form.id ? 'btn-success' : 'btn-primary'}`}
                      disabled={
                        saving ||
                        (form.id
                          ? !keycloak.hasRealmRole("data-edit")
                          : !keycloak.hasRealmRole("data-create"))
                      }
                    >
                      {saving ? "⏳ Salvando..." : (form.id ? "💾 Atualizar" : "➕ Criar")}
                    </button>
                    {form.id && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="btn btn-secondary"
                        disabled={saving}
                      >
                        ❌ Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* Data List Section */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">📋 Itens Cadastrados</h3>
                <button
                  onClick={fetchData}
                  disabled={!keycloak.hasRealmRole("data-read") || loading}
                  className="btn btn-secondary btn-sm"
                >
                  {loading ? "⏳ Carregando..." : "🔄 Atualizar"}
                </button>
              </div>

              {loading ? (
                <div className="loading-state">
                  <div className="loading-icon pulse">⏳</div>
                  <p className="loading-text">Carregando dados...</p>
                </div>
              ) : data.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  <p className="empty-text">Nenhum item encontrado</p>
                  {keycloak.hasRealmRole("data-create") && (
                    <p className="empty-subtext">
                      Clique em "Criar" acima para adicionar o primeiro item
                    </p>
                  )}
                </div>
              ) : (
                <div className="data-list">
                  {data.map((item) => (
                    <div key={item.id} className="data-item">
                      <div className="data-item-header">
                        <div>
                          <h4 className="data-item-title">{item.name}</h4>
                          <p className="data-item-description">{item.description}</p>
                        </div>
                        <div className="data-item-actions">
                          {keycloak.hasRealmRole("data-edit") && (
                            <button
                              onClick={() => handleEdit(item)}
                              className="btn btn-secondary btn-sm"
                            >
                              ✏️ Editar
                            </button>
                          )}
                          {keycloak.hasRealmRole("data-delete") && (
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="btn btn-danger btn-sm"
                            >
                              🗑️ Deletar
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="data-item-id">
                        ID: {item.id}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
