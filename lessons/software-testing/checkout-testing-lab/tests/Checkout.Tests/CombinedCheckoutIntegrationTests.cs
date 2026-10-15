using Checkout.Core;
using Npgsql;
using NSubstitute;
using Testcontainers.PostgreSql;
using WireMock.Matchers;
using WireMock.RequestBuilders;
using WireMock.ResponseBuilders;
using WireMock.Server;
using Xunit;
namespace Checkout.Tests;
public sealed class CombinedCheckoutIntegrationTests
{
 [Fact] public async Task Approved_payment_reaches_postgres_and_notification()
 {
  await using var db=await StartDatabase();
  using var payment=PaymentServer(3998,"valid",true);
  using var http=new HttpClient { BaseAddress=new Uri(payment.Url!) };
  var inventory=Substitute.For<IInventory>();var notifier=Substitute.For<INotifier>();
  inventory.InStockAsync("BOOK-1",2,Arg.Any<CancellationToken>()).Returns(Task.FromResult(true));
  var store=new PgOrderStore(db.GetConnectionString());await store.InitializeAsync();
  var result=await new CheckoutService(inventory,new HttpPaymentGateway(http),store,notifier)
    .PlaceAsync(new("BOOK-1",2,"valid"));
  Assert.True(result.Success);Assert.NotNull(result.OrderId);
  Assert.Single(payment.LogEntries);
  Assert.Equal(("BOOK-1",2,3998),await ReadOrder(db.GetConnectionString(),result.OrderId!.Value));
  await inventory.Received(1).InStockAsync("BOOK-1",2,Arg.Any<CancellationToken>());
  await notifier.Received(1).OrderPlacedAsync(result.OrderId.Value,Arg.Any<CancellationToken>());
 }
 [Fact] public async Task Declined_payment_creates_no_order()
 {
  await using var db=await StartDatabase();
  using var payment=PaymentServer(3998,"declined",false);
  using var http=new HttpClient { BaseAddress=new Uri(payment.Url!) };
  var inventory=Substitute.For<IInventory>();var notifier=Substitute.For<INotifier>();
  inventory.InStockAsync("BOOK-1",2,Arg.Any<CancellationToken>()).Returns(Task.FromResult(true));
  var store=new PgOrderStore(db.GetConnectionString());await store.InitializeAsync();
  var result=await new CheckoutService(inventory,new HttpPaymentGateway(http),store,notifier)
    .PlaceAsync(new("BOOK-1",2,"declined"));
  Assert.Equal("Payment declined",result.Status);Assert.Single(payment.LogEntries);
  Assert.Equal(0,await CountOrders(db.GetConnectionString()));
  await notifier.DidNotReceiveWithAnyArgs().OrderPlacedAsync(default);
 }
 [Fact] public async Task Database_error_after_payment_exposes_nonatomic_checkout()
 {
  await using var db=await StartDatabase();
  using var payment=PaymentServer(1999,"valid",true);
  using var http=new HttpClient { BaseAddress=new Uri(payment.Url!) };
  var inventory=Substitute.For<IInventory>();var notifier=Substitute.For<INotifier>();
  inventory.InStockAsync("BOOK-1",1,Arg.Any<CancellationToken>()).Returns(Task.FromResult(true));
  // Missing orders table: real insert fails after the external payment is approved.
  var service=new CheckoutService(inventory,new HttpPaymentGateway(http),new PgOrderStore(db.GetConnectionString()),notifier);
  var ex=await Assert.ThrowsAsync<PostgresException>(()=>service.PlaceAsync(new("BOOK-1",1,"valid")));
  Assert.Equal("42P01",ex.SqlState);
  Assert.Single(payment.LogEntries);
  await notifier.DidNotReceiveWithAnyArgs().OrderPlacedAsync(default);
 }
 private static WireMockServer PaymentServer(int amountCents,string token,bool approved)
 {
  var s=WireMockServer.Start();
  s.Given(Request.Create().WithPath("/authorize").UsingPost()
    .WithBody(new JsonMatcher(new { amountCents,token })))
   .RespondWith(Response.Create().WithStatusCode(200)
    .WithHeader("Content-Type","application/json")
    .WithBody(approved?"{\"approved\":true}":"{\"approved\":false}"));
  return s;
 }
 private static async Task<PostgreSqlContainer> StartDatabase()
 {
  var db=new PostgreSqlBuilder().WithImage("postgres:16-alpine")
   .WithDatabase("checkout_tests").WithUsername("postgres").WithPassword("postgres").Build();
  await db.StartAsync();return db;
 }
 private static async Task<(string,int,int)> ReadOrder(string cs,Guid id)
 {
  await using var c=new NpgsqlConnection(cs);await c.OpenAsync();
  await using var cmd=new NpgsqlCommand("SELECT sku,quantity,total_cents FROM orders WHERE id=@id",c);
  cmd.Parameters.AddWithValue("id",id);
  await using var reader=await cmd.ExecuteReaderAsync();
  Assert.True(await reader.ReadAsync());
  var row=(reader.GetString(0),reader.GetInt32(1),reader.GetInt32(2));
  Assert.False(await reader.ReadAsync());return row;
 }
 private static async Task<long> CountOrders(string cs)
 {
  await using var c=new NpgsqlConnection(cs);await c.OpenAsync();
  await using var cmd=new NpgsqlCommand("SELECT COUNT(*) FROM orders",c);
  return Convert.ToInt64(await cmd.ExecuteScalarAsync());
 }
}
