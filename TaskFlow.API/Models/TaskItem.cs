namespace TaskFlow.API.Models;

public class TaskItem
{
    public int Id { get; set; }
    public string Text { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public bool Done { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DueDate { get; set; }
    public string? Notes    { get; set; }
    public DateTime? DeletedAt { get; set; }
    public ICollection<Tag>     Tags     { get; set; } = new List<Tag>();
    public ICollection<SubTask> SubTasks { get; set; } = new List<SubTask>();
}
