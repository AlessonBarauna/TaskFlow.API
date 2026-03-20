using TaskFlow.API.DTOs;
using TaskFlow.API.Models;

namespace TaskFlow.API.Repositories;

public interface ITaskRepository
{
    Task<PagedResult<TaskItem>> GetAllAsync(TaskQueryParams q);

    Task<TaskItem?> GetByIdAsync(int id);

    Task<TaskItem> CreateAsync(TaskItem task);

    Task<TaskItem?> UpdateAsync(int id, TaskItem task);

    Task<bool> DeleteAsync(int id);     // soft delete

    Task<bool> RestoreAsync(int id);
}
