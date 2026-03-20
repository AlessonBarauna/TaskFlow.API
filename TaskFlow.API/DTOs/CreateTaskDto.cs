using System.ComponentModel.DataAnnotations;

namespace TaskFlow.API.DTOs;

public class CreateTaskDto
{
    [Required(ErrorMessage = "O texto da tarefa é obrigatório.")]
    [MaxLength(200, ErrorMessage = "O texto deve ter no máximo 200 caracteres.")]
    public string Text { get; set; } = string.Empty;

    [Required(ErrorMessage = "A prioridade é obrigatória.")]
    [RegularExpression("baixa|media|alta", ErrorMessage = "Prioridade deve ser: baixa, media ou alta.")]
    public string Priority { get; set; } = string.Empty;

    public bool Done { get; set; } = false;

    public DateTime? DueDate { get; set; }
    public string?   Notes   { get; set; }
}
