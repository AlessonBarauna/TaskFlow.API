using System.ComponentModel.DataAnnotations;

namespace TaskFlow.API.DTOs;

public class CreateSubTaskDto
{
    [Required][MaxLength(200)]
    public string Text { get; set; } = string.Empty;
}

public class UpdateSubTaskDto
{
    [Required][MaxLength(200)]
    public string Text { get; set; } = string.Empty;
    public bool Done { get; set; }
}

public class SubTaskResponseDto
{
    public int    Id         { get; set; }
    public string Text       { get; set; } = string.Empty;
    public bool   Done       { get; set; }
    public int    TaskItemId { get; set; }
}
