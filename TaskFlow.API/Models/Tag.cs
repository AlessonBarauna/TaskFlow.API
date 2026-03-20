namespace TaskFlow.API.Models;

public class Tag
{
    public int    Id    { get; set; }
    public string Name  { get; set; } = string.Empty;
    public string Color { get; set; } = "#00ff88";

    public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
}
