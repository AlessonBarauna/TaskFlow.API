using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskFlow.API.Data;
using TaskFlow.API.DTOs;
using TaskFlow.API.Models;

namespace TaskFlow.API.Controllers;

[ApiController]
[Route("api/tasks/{taskId}/subtasks")]
public class SubTasksController : ControllerBase
{
    private readonly AppDbContext _context;
    public SubTasksController(AppDbContext context) => _context = context;

    // POST api/tasks/3/subtasks
    [HttpPost]
    public async Task<IActionResult> Create(int taskId, CreateSubTaskDto dto)
    {
        var task = await _context.Tasks.FindAsync(taskId);
        if (task == null) return NotFound();

        var sub = new SubTask { Text = dto.Text, TaskItemId = taskId };
        _context.SubTasks.Add(sub);
        await _context.SaveChangesAsync();

        return Ok(new SubTaskResponseDto { Id = sub.Id, Text = sub.Text, Done = sub.Done, TaskItemId = sub.TaskItemId });
    }

    // PUT api/tasks/3/subtasks/7
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int taskId, int id, UpdateSubTaskDto dto)
    {
        var sub = await _context.SubTasks.FirstOrDefaultAsync(s => s.Id == id && s.TaskItemId == taskId);
        if (sub == null) return NotFound();

        sub.Text = dto.Text;
        sub.Done = dto.Done;
        await _context.SaveChangesAsync();

        return Ok(new SubTaskResponseDto { Id = sub.Id, Text = sub.Text, Done = sub.Done, TaskItemId = sub.TaskItemId });
    }

    // DELETE api/tasks/3/subtasks/7
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int taskId, int id)
    {
        var sub = await _context.SubTasks.FirstOrDefaultAsync(s => s.Id == id && s.TaskItemId == taskId);
        if (sub == null) return NotFound();

        _context.SubTasks.Remove(sub);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
