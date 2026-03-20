using System.ComponentModel.DataAnnotations;

namespace TaskFlow.API.DTOs;

public class CreateTagDto
{
    [Required][MaxLength(30)]
    public string Name  { get; set; } = string.Empty;
    public string Color { get; set; } = "#00ff88";
}

public class TagResponseDto
{
    public int    Id    { get; set; }
    public string Name  { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
}
