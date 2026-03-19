# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Build
dotnet build

# Run (HTTP on port 5062, HTTPS on port 7155)
dotnet run
dotnet run --launch-profile http

# Database migrations
dotnet ef migrations add <MigrationName>
dotnet ef database update

# Publish
dotnet publish -c Release
```

Swagger UI is available at `/swagger` when running in Development mode.

## Architecture

ASP.NET Core 10 Web API for task management. Uses SQLite via Entity Framework Core with code-first migrations.

**Layers:**
- `Controllers/` — HTTP request handling; `TasksController` exposes REST endpoints at `/api/tasks`
- `Models/` — Domain entities (`TaskItem`: Id, Text, Priority, Done, CreatedAt)
- `Data/` — EF Core `AppDbContext` with a single `Tasks` DbSet
- `Migrations/` — Database version history (do not edit manually)

**Key patterns:**
- Constructor injection everywhere; DbContext is scoped per-request
- All controller actions are `async`/`await`
- Nullable reference types enabled (`<Nullable>enable</Nullable>`)
- Implicit usings enabled

**Database:** SQLite file `taskflow.db` at the project root (connection string in `Program.cs`).
