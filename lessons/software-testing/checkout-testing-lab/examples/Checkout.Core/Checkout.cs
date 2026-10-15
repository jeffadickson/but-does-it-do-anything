using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Npgsql;
namespace Checkout.Core;
public record CheckoutRequest(string Sku,int Quantity,string PaymentToken);
public record CheckoutResult(bool Success,string Status,Guid? OrderId=null);
public record PaymentRequest([property:JsonPropertyName("amountCents")]int AmountCents,[property:JsonPropertyName("token")]string Token);
public record PaymentResponse([property:JsonPropertyName("approved")]bool Approved);
public interface IInventory { Task<bool> InStockAsync(string sku,int quantity,CancellationToken ct=default); }
public interface INotifier { Task OrderPlacedAsync(Guid orderId,CancellationToken ct=default); }
public interface IOrderStore { Task SaveAsync(Guid id,string sku,int quantity,int totalCents,CancellationToken ct=default); }
public interface IPaymentGateway { Task<bool> AuthorizeAsync(int cents,string token,CancellationToken ct=default); }
public sealed class CheckoutService(IInventory inventory,IPaymentGateway payments,IOrderStore orders,INotifier notifier)
{
 public async Task<CheckoutResult> PlaceAsync(CheckoutRequest request,CancellationToken ct=default)
 {
  if(string.IsNullOrWhiteSpace(request.Sku)||request.Quantity<=0||request.Quantity>10) return new(false,"Invalid cart");
  if(!await inventory.InStockAsync(request.Sku,request.Quantity,ct)) return new(false,"Out of stock");
  int cents=checked(request.Quantity*1999);
  if(!await payments.AuthorizeAsync(cents,request.PaymentToken,ct)) return new(false,"Payment declined");
  Guid id=Guid.NewGuid();
  await orders.SaveAsync(id,request.Sku,request.Quantity,cents,ct);
  await notifier.OrderPlacedAsync(id,ct);
  return new(true,"Order placed",id);
 }
}
public sealed class HttpPaymentGateway(HttpClient client):IPaymentGateway
{
 public async Task<bool> AuthorizeAsync(int cents,string token,CancellationToken ct=default)
 {
  using var response=await client.PostAsJsonAsync("/authorize",new PaymentRequest(cents,token),ct);
  response.EnsureSuccessStatusCode();
  var result=await response.Content.ReadFromJsonAsync<PaymentResponse>(cancellationToken:ct);
  return result?.Approved==true;
 }
}
public sealed class PgOrderStore(string connectionString):IOrderStore
{
 public async Task InitializeAsync()
 {
  await using var conn=new NpgsqlConnection(connectionString);await conn.OpenAsync();
  await using var cmd=new NpgsqlCommand("CREATE TABLE IF NOT EXISTS orders(id UUID PRIMARY KEY,sku TEXT NOT NULL,quantity INTEGER NOT NULL,total_cents INTEGER NOT NULL)",conn);
  await cmd.ExecuteNonQueryAsync();
 }
 public async Task SaveAsync(Guid id,string sku,int quantity,int totalCents,CancellationToken ct=default)
 {
  await using var conn=new NpgsqlConnection(connectionString);await conn.OpenAsync(ct);
  await using var cmd=new NpgsqlCommand("INSERT INTO orders(id,sku,quantity,total_cents) VALUES (@id,@sku,@quantity,@total)",conn);
  cmd.Parameters.AddWithValue("id",id);cmd.Parameters.AddWithValue("sku",sku);cmd.Parameters.AddWithValue("quantity",quantity);cmd.Parameters.AddWithValue("total",totalCents);
  await cmd.ExecuteNonQueryAsync(ct);
 }
}
