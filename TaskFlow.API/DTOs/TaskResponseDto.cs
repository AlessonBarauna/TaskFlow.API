namespace TaskFlow.API.DTOs;

public class TaskResponseDto
{
    public int Id { get; set; }
    public string Text { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public bool Done { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? DueDate { get; set; }
    public string?                  Notes    { get; set; }
    public List<TagResponseDto>     Tags     { get; set; } = new();
    public List<SubTaskResponseDto> SubTasks { get; set; } = new();
}
