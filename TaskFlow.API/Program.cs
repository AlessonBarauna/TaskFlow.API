using Microsoft.EntityFrameworkCore;
using TaskFlow.API.Data;
using TaskFlow.API.Repositories;

var builder = WebApplication.CreateBuilder(args);

// Configura CORS para permitir requisições do Angular
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

// Habilita o uso de Controllers (padrão de mercado)
builder.Services.AddControllers();

builder.Services.AddScoped<ITaskRepository, TaskRepository>();

// Configura o Swagger para documentar e testar a API
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configura o SQLite — vai criar um arquivo taskflow.db na pasta do projeto
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=taskflow.db"));

var app = builder.Build();

// Em desenvolvimento, exibe a interface visual do Swagger
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.MapGet("/", () => Results.Redirect("/swagger")).ExcludeFromDescription();
}

app.UseHttpsRedirection();
app.UseCors("AllowAngular");
app.UseAuthorization();

// Diz pro .NET procurar os Controllers automaticamente
app.MapControllers();

app.Run();