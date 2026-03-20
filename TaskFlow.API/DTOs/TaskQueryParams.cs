namespace TaskFlow.API.DTOs;

public class TaskQueryParams
{
    public int    Page     { get; set; } = 1;
    public int    Limit    { get; set; } = 20;
    public string? Priority { get; set; }   // "baixa" | "media" | "alta"
    public bool?  Done     { get; set; }
    public string? Search  { get; set; }
    public bool   Deleted  { get; set; } = false; // true = mostrar lixeira
}
