using Microsoft.EntityFrameworkCore;
using TaskFlow.API.Models;

namespace TaskFlow.API.Data;

public class AppDbContext : DbContext
{
    // Construtor padrão — recebe as configurações via injeção de dependência
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // Cada DbSet representa uma tabela no banco
    // Essa linha diz: "cria uma tabela chamada Tasks para a classe TaskItem"
    public DbSet<TaskItem> Tasks { get; set; }
}