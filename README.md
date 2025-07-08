# Autenticação Keycloak

## Stack

-   **Back-end**: NodeJs
-   **Front-end**: React
-   **Autenticação/Autorização**: Keycloak

## Estrutura do Projeto

```
├── api/
├── app/
├── opt/
└── compose.yml
```

## Executando

### Rodando o Keycloak
```bash
KEYCLOAK_ADMIN_USER=admin KEYCLOAK_ADMIN_PASSWORD=senhaadmin docker compose up
```

### Rodando o backend
Backend vai rodar na porta 3000
```bash
cd api && npm install && node src/index.js
```
### Rodando o frontend
Backend vai rodar na porta 3001
```bash
cd app && npm install && npm run dev
```

## Acessando aplicação

1.  Acesse o frontend: **[http://localhost:3001](http://localhost:3001)**
2.  Faça login com um dos dois usuários de teste abaixo:
 - `admin`:`1234` => Pode listar, criar, editar e excluir itens.
 - `user`:`1234` => Pode apenas visualizar a lista de itens.

### Acessando painel admin do Keycloak
Acesse o painel admin do Keycloak: **[http://localhost:8080](http://localhost:8080)**
1.  Faça login com o usuário e senha definidos na variável de ambiente `KEYCLOAK_ADMIN_USER` e `KEYCLOAK_ADMIN_PASSWORD`.
