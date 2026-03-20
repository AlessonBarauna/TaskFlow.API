namespace TaskFlow.API.Models;

public class SubTask
{
    public int    Id         { get; set; }
    public string Text       { get; set; } = string.Empty;
    public bool   Done       { get; set; } = false;
    public int    TaskItemId { get; set; }
    public TaskItem TaskItem { get; set; } = null!;
}
