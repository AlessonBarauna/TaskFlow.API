using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskFlow.API.Data;
using TaskFlow.API.Models;

namespace TaskFlow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TasksController : ControllerBase
{
    private readonly AppDbContext _context;

    // O .NET injeta o AppDbContext automaticamente (injeção de dependência)
    public TasksController(AppDbContext context)
    {
        _context = context;
    }

    // GET /api/tasks
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var tasks = await _context.Tasks.ToListAsync();
        return Ok(tasks);
    }

    // GET /api/tasks/1
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var task = await _context.Tasks.FindAsync(id);

        if (task == null)
            return NotFound(new { message = $"Tarefa {id} não encontrada." });

        return Ok(task);
    }

    // POST /api/tasks
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] TaskItem newTask)
    {
        _context.Tasks.Add(newTask);
        await _context.SaveChangesAsync(); // persiste no banco

        return CreatedAtAction(nameof(GetById), new { id = newTask.Id }, newTask);
    }

    // PUT /api/tasks/1
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] TaskItem updatedTask)
    {
        var task = await _context.Tasks.FindAsync(id);

        if (task == null)
            return NotFound(new { message = $"Tarefa {id} não encontrada." });

        task.Text     = updatedTask.Text;
        task.Priority = updatedTask.Priority;
        task.Done     = updatedTask.Done;

        await _context.SaveChangesAsync(); // salva as alterações

        return Ok(task);
    }

    // DELETE /api/tasks/1
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var task = await _context.Tasks.FindAsync(id);

        if (task == null)
            return NotFound(new { message = $"Tarefa {id} não encontrada." });

        _context.Tasks.Remove(task);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}