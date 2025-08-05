namespace WebApplication2.Responces
{
    public class Response<T>
    {
        public T data {  get; set; }
        public string message { get; set; }
        public bool success { get; set; }
    }
}
