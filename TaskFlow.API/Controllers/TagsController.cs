using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskFlow.API.Data;
using TaskFlow.API.DTOs;
using TaskFlow.API.Models;

namespace TaskFlow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TagsController : ControllerBase
{
    private readonly AppDbContext _context;
    public TagsController(AppDbContext context) => _context = context;

    // GET api/tags
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var tags = await _context.Tags
            .Select(t => new TagResponseDto { Id = t.Id, Name = t.Name, Color = t.Color })
            .ToListAsync();
        return Ok(tags);
    }

    // POST api/tags
    [HttpPost]
    public async Task<IActionResult> Create(CreateTagDto dto)
    {
        var tag = new Tag { Name = dto.Name, Color = dto.Color };
        _context.Tags.Add(tag);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new TagResponseDto { Id = tag.Id, Name = tag.Name, Color = tag.Color });
    }

    // DELETE api/tags/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var tag = await _context.Tags.FindAsync(id);
        if (tag == null) return NotFound();
        _context.Tags.Remove(tag);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // POST api/tags/5/tasks/3  → adiciona tag 5 na task 3
    [HttpPost("{tagId}/tasks/{taskId}")]
    public async Task<IActionResult> AddToTask(int tagId, int taskId)
    {
        var tag  = await _context.Tags.Include(t => t.Tasks).FirstOrDefaultAsync(t => t.Id == tagId);
        var task = await _context.Tasks.FindAsync(taskId);
        if (tag == null || task == null) return NotFound();
        if (!tag.Tasks.Contains(task)) tag.Tasks.Add(task);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // DELETE api/tags/5/tasks/3  → remove tag 5 da task 3
    [HttpDelete("{tagId}/tasks/{taskId}")]
    public async Task<IActionResult> RemoveFromTask(int tagId, int taskId)
    {
        var tag  = await _context.Tags.Include(t => t.Tasks).FirstOrDefaultAsync(t => t.Id == tagId);
        var task = await _context.Tasks.FindAsync(taskId);
        if (tag == null || task == null) return NotFound();
        tag.Tasks.Remove(task);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
