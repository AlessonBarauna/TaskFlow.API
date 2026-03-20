# ⚡ TaskFlow

Organizador de tarefas com prioridades, subtarefas, tags e muito mais.
Stack: **ASP.NET Core 10** (API) + **Angular 19** (frontend) + **SQLite**.

---

## Sumário

- [Funcionalidades](#funcionalidades)
- [Requisitos](#requisitos)
- [Como rodar](#como-rodar)
- [Usando o app](#usando-o-app)
- [Endpoints da API](#endpoints-da-api)
- [Estrutura do projeto](#estrutura-do-projeto)

---

## Funcionalidades

| Recurso | Descrição |
|---|---|
| **Tarefas** | Criar, editar, concluir e deletar tarefas com prioridade (alta / média / baixa) |
| **Prazo** | Adicionar data limite com aviso de atraso |
| **Notas** | Campo de texto livre em cada tarefa |
| **Subtarefas** | Checklist dentro da tarefa com barra de progresso |
| **Tags** | Categorização com cores customizáveis (many-to-many) |
| **Lixeira** | Soft delete — tarefas deletadas ficam na lixeira e podem ser restauradas |
| **Filtros na API** | Filtrar por prioridade, status (feita/pendente) e busca por texto |
| **Paginação** | Resultados paginados server-side |
| **Tema** | Modo escuro / claro com alternância via botão ou tecla `T` |
| **Drag & Drop** | Reordenar tarefas arrastando |
| **Modo Foco** | Exibe apenas a tarefa de maior prioridade pendente |
| **Streak** | Contador de dias consecutivos com tarefas concluídas |
| **Sons** | Feedback sonoro ao concluir tarefas (ativável/desativável) |
| **Notificações** | Notificações do browser para tarefas vencendo hoje ou atrasadas |
| **Confetti** | Animação ao concluir 100% das tarefas |
| **Undo delete** | Desfazer exclusão em até 4 segundos |

---

## Requisitos

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/) e npm
- [Angular CLI](https://angular.io/cli): `npm install -g @angular/cli`
- [EF Core CLI](https://learn.microsoft.com/ef/core/cli/dotnet): `dotnet tool install --global dotnet-ef`

---

## Como rodar

### 1. Backend (API)

```bash
cd TaskFlow.API

# Aplicar migrations e criar o banco SQLite
dotnet ef database update

# Rodar a API (porta 5062)
dotnet run --launch-profile http
```

A API estará disponível em `http://localhost:5062`.
Swagger UI: `http://localhost:5062/swagger`

---

### 2. Frontend (Angular)

```bash
cd taskflow-frontend

# Instalar dependências
npm install

# Rodar em modo desenvolvimento
ng serve
```

Acesse em `http://localhost:4200`.

> A API precisa estar rodando para o frontend funcionar.

---

## Usando o app

### Criar uma tarefa

1. Digite o texto no campo **"Nova tarefa..."**
2. Escolha a prioridade: 🔴 Alta / 🟡 Média / 🟢 Baixa
3. Opcionalmente defina um prazo (campo de data)
4. Pressione **Enter** ou clique em **+ Add**

### Editar uma tarefa

- **Duplo clique** no texto da tarefa para editar inline
- Clique na **prioridade** (ex: `ALTA ↻`) para ciclar entre os níveis
- Clique em **+ prazo** para definir ou alterar a data limite

### Subtarefas e Notas

- Clique no botão **≡** (ou no percentual de progresso) no canto direito da tarefa para expandir
- Na aba expandida, escreva uma nota ou adicione subtarefas com Enter

### Tags

- Clique em **🏷️ Tags** para abrir o gerenciador
- Crie tags com nome e cor personalizados
- Nas tarefas, clique em **+ tag** para associar uma tag
- Clique em uma tag no gerenciador para filtrar as tarefas por ela
- Clique na tag associada à tarefa para removê-la

### Lixeira

- Clique em **✕** para deletar uma tarefa (soft delete — vai para a lixeira)
- Desfaça a exclusão clicando em **Desfazer** no toast que aparece (4 segundos)
- Acesse a **🗑️ lixeira** nos filtros para ver tarefas deletadas
- Clique em **↩** para restaurar uma tarefa da lixeira

### Filtros e busca

| Controle | Função |
|---|---|
| Filtros (`todas`, `alta`, `média`, `baixa`, `concluídas`) | Filtra por status/prioridade — enviado à API |
| Campo de busca | Busca por texto — enviado à API com debounce de 300ms |
| 🗑️ Lixeira | Mostra tarefas em soft delete |
| Ordenação | Alterna entre 🕐 Data / 🔢 Prioridade / 📅 Prazo / ↕️ Custom (drag & drop) |

### Paginação

Quando há mais de 20 tarefas no filtro atual, os controles de paginação aparecem abaixo da lista.

### Atalhos de teclado

| Tecla | Ação |
|---|---|
| `N` | Foca no campo de nova tarefa |
| `F` | Foca na busca |
| `Z` | Ativa/desativa Modo Foco |
| `T` | Alterna tema escuro/claro |
| `Esc` | Cancela edição / fecha overlay |

---

## Endpoints da API

### Tarefas

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/tasks` | Listar tarefas (suporta filtros e paginação) |
| `GET` | `/api/tasks/{id}` | Buscar tarefa por ID |
| `POST` | `/api/tasks` | Criar tarefa |
| `PUT` | `/api/tasks/{id}` | Atualizar tarefa |
| `DELETE` | `/api/tasks/{id}` | Soft delete (move para lixeira) |
| `POST` | `/api/tasks/{id}/restore` | Restaurar da lixeira |

**Query params disponíveis no GET /api/tasks:**

| Param | Tipo | Exemplo |
|---|---|---|
| `page` | int | `?page=1` |
| `limit` | int | `?limit=20` |
| `priority` | string | `?priority=alta` |
| `done` | bool | `?done=false` |
| `search` | string | `?search=reunião` |
| `deleted` | bool | `?deleted=true` (lixeira) |

### Tags

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/tags` | Listar todas as tags |
| `POST` | `/api/tags` | Criar tag |
| `DELETE` | `/api/tags/{id}` | Deletar tag |
| `POST` | `/api/tags/{tagId}/tasks/{taskId}` | Associar tag à tarefa |
| `DELETE` | `/api/tags/{tagId}/tasks/{taskId}` | Remover tag da tarefa |

### Subtarefas

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/tasks/{taskId}/subtasks` | Criar subtarefa |
| `PUT` | `/api/tasks/{taskId}/subtasks/{id}` | Atualizar subtarefa |
| `DELETE` | `/api/tasks/{taskId}/subtasks/{id}` | Deletar subtarefa |

---

## Estrutura do projeto

```
taskFlow/
├── TaskFlow.API/               # Backend ASP.NET Core 10
│   ├── Controllers/            # TasksController, TagsController, SubTasksController
│   ├── DTOs/                   # Objetos de transferência de dados
│   ├── Models/                 # TaskItem, Tag, SubTask
│   ├── Repositories/           # ITaskRepository, TaskRepository
│   ├── Data/                   # AppDbContext (EF Core)
│   └── Migrations/             # Histórico de migrations SQLite
│
└── taskflow-frontend/          # Frontend Angular 19
    └── src/app/
        ├── components/
        │   └── task-list/      # Componente principal (signals)
        ├── models/             # Interfaces TypeScript
        └── services/           # TaskService, TagService, SubTaskService
```
