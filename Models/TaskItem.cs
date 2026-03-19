namespace TaskFlow.API.Models;

public class TaskItem
{
    public int Id { get; set; }

    public string Text { get; set; } = string.Empty;

    public string Priority  { get; set;}

    public bool Done { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

}