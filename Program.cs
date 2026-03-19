using Microsoft.EntityFrameworkCore;
using TaskFlow.API.Data;

var builder = WebApplication.CreateBuilder(args);

// Habilita o uso de Controllers (padrão de mercado)
builder.Services.AddControllers();

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
}

app.UseHttpsRedirection();
app.UseAuthorization();

// Diz pro .NET procurar os Controllers automaticamente
app.MapControllers();

app.Run();