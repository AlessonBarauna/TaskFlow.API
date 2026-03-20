using Microsoft.EntityFrameworkCore;
using TaskFlow.API.Data;
using TaskFlow.API.DTOs;
using TaskFlow.API.Models;

namespace TaskFlow.API.Repositories;

public class TaskRepository : ITaskRepository
{
    private readonly AppDbContext _context;

    public TaskRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<TaskItem>> GetAllAsync(TaskQueryParams q)
    {
        var query = _context.Tasks
            .Include(t => t.Tags)
            .Include(t => t.SubTasks)
            .AsQueryable();

        // Soft delete filter
        query = q.Deleted
            ? query.Where(t => t.DeletedAt != null)
            : query.Where(t => t.DeletedAt == null);

        // Filters
        if (!string.IsNullOrWhiteSpace(q.Priority))
            query = query.Where(t => t.Priority == q.Priority);

        if (q.Done.HasValue)
            query = query.Where(t => t.Done == q.Done.Value);

        if (!string.IsNullOrWhiteSpace(q.Search))
            query = query.Where(t => t.Text.Contains(q.Search));

        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((q.Page - 1) * q.Limit)
            .Take(q.Limit)
            .ToListAsync();

        return new PagedResult<TaskItem>
        {
            Items = items,
            Total = total,
            Page  = q.Page,
            Limit = q.Limit
        };
    }

    public async Task<TaskItem?> GetByIdAsync(int id)
        => await _context.Tasks
            .Include(t => t.Tags)
            .Include(t => t.SubTasks)
            .FirstOrDefaultAsync(t => t.Id == id && t.DeletedAt == null);

    public async Task<TaskItem> CreateAsync(TaskItem task)
    {
        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();
        return task;
    }

    public async Task<TaskItem?> UpdateAsync(int id, TaskItem updatedTask)
    {
        var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == id && t.DeletedAt == null);
        if (task == null) return null;

        task.Text     = updatedTask.Text;
        task.Priority = updatedTask.Priority;
        task.Done     = updatedTask.Done;
        task.DueDate  = updatedTask.DueDate;
        task.Notes    = updatedTask.Notes;

        await _context.SaveChangesAsync();
        return task;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == id && t.DeletedAt == null);
        if (task == null) return false;

        task.DeletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RestoreAsync(int id)
    {
        var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == id && t.DeletedAt != null);
        if (task == null) return false;

        task.DeletedAt = null;
        await _context.SaveChangesAsync();
        return true;
    }
}
