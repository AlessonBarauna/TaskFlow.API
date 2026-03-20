namespace TaskFlow.API.DTOs;

public class PagedResult<T>
{
    public IEnumerable<T> Items      { get; set; } = [];
    public int            Total      { get; set; }
    public int            Page       { get; set; }
    public int            Limit      { get; set; }
    public int            TotalPages => (int)Math.Ceiling((double)Total / Limit);
}
