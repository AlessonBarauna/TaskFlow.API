using Microsoft.AspNetCore.Mvc;
using TaskFlow.API.DTOs;
using TaskFlow.API.Models;
using TaskFlow.API.Repositories;

namespace TaskFlow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TasksController : ControllerBase
{
    private readonly ITaskRepository _repository;

    public TasksController(ITaskRepository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] TaskQueryParams q)
    {
        var result = await _repository.GetAllAsync(q);
        return Ok(new PagedResult<TaskResponseDto>
        {
            Items      = result.Items.Select(t => ToDto(t)),
            Total      = result.Total,
            Page       = result.Page,
            Limit      = result.Limit
        });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var task = await _repository.GetByIdAsync(id);
        if (task == null)
            return NotFound(new { message = $"Tarefa {id} não encontrada." });
        return Ok(ToDto(task));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTaskDto dto)
    {
        var task = new TaskItem
        {
            Text     = dto.Text,
            Priority = dto.Priority,
            DueDate  = dto.DueDate,
            Notes    = dto.Notes
        };
        var created = await _repository.CreateAsync(task);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, ToDto(created));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateTaskDto dto)
    {
        var task = new TaskItem
        {
            Text     = dto.Text,
            Priority = dto.Priority,
            Done     = dto.Done,
            DueDate  = dto.DueDate,
            Notes    = dto.Notes
        };
        var updated = await _repository.UpdateAsync(id, task);
        if (updated == null)
            return NotFound(new { message = $"Tarefa {id} não encontrada." });
        return Ok(ToDto(updated));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _repository.DeleteAsync(id);
        if (!deleted)
            return NotFound(new { message = $"Tarefa {id} não encontrada." });
        return NoContent();
    }

    [HttpPost("{id}/restore")]
    public async Task<IActionResult> Restore(int id)
    {
        var restored = await _repository.RestoreAsync(id);
        if (!restored)
            return NotFound(new { message = $"Tarefa {id} não encontrada na lixeira." });
        return NoContent();
    }

    private static TaskResponseDto ToDto(TaskItem t) => new()
    {
        Id        = t.Id,
        Text      = t.Text,
        Priority  = t.Priority,
        Done      = t.Done,
        CreatedAt = t.CreatedAt,
        DueDate   = t.DueDate,
        Notes     = t.Notes,
        Tags      = t.Tags.Select(tag => new TagResponseDto
        {
            Id    = tag.Id,
            Name  = tag.Name,
            Color = tag.Color
        }).ToList(),
        SubTasks  = t.SubTasks.Select(s => new SubTaskResponseDto
        {
            Id         = s.Id,
            Text       = s.Text,
            Done       = s.Done,
            TaskItemId = s.TaskItemId
        }).ToList()
    };
}
