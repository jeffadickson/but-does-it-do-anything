using Checkout.Core;
using NSubstitute;
using Xunit;
namespace Checkout.Tests;
public class CheckoutTests
{
 [Fact] public async Task Invalid_quantity_does_not_touch_dependencies()
 {
  var inventory=Substitute.For<IInventory>();
  var payments=Substitute.For<IPaymentGateway>();
  var orders=Substitute.For<IOrderStore>();
  var notifier=Substitute.For<INotifier>();
  var result=await new CheckoutService(inventory,payments,orders,notifier).PlaceAsync(new CheckoutRequest("BOOK-1",0,"valid"));
  Assert.False(result.Success);
  await inventory.DidNotReceiveWithAnyArgs().InStockAsync(default!,default);
  await payments.DidNotReceiveWithAnyArgs().AuthorizeAsync(default,default!);
  await orders.DidNotReceiveWithAnyArgs().SaveAsync(default,default!,default,default);
  await notifier.DidNotReceiveWithAnyArgs().OrderPlacedAsync(default);
 }
 [Fact] public async Task Accepted_order_charges_correct_cents_and_notifies()
 {
  var inventory=Substitute.For<IInventory>();
  var payments=Substitute.For<IPaymentGateway>();
  var orders=Substitute.For<IOrderStore>();
  var notifier=Substitute.For<INotifier>();
  inventory.InStockAsync("BOOK-1",2,Arg.Any<CancellationToken>()).Returns(Task.FromResult(true));
  payments.AuthorizeAsync(3998,"valid",Arg.Any<CancellationToken>()).Returns(Task.FromResult(true));
  var result=await new CheckoutService(inventory,payments,orders,notifier).PlaceAsync(new("BOOK-1",2,"valid"));
  Assert.True(result.Success);
  Assert.NotNull(result.OrderId);
  await payments.Received(1).AuthorizeAsync(3998,"valid",Arg.Any<CancellationToken>());
  await orders.Received(1).SaveAsync(result.OrderId!.Value,"BOOK-1",2,3998,Arg.Any<CancellationToken>());
  await notifier.Received(1).OrderPlacedAsync(result.OrderId.Value,Arg.Any<CancellationToken>());
 }
 [Fact] public async Task Declined_order_never_persists_or_notifies()
 {
  var inventory=Substitute.For<IInventory>();
  var payments=Substitute.For<IPaymentGateway>();
  var orders=Substitute.For<IOrderStore>();
  var notifier=Substitute.For<INotifier>();
  inventory.InStockAsync("BOOK-1",2,Arg.Any<CancellationToken>()).Returns(Task.FromResult(true));
  payments.AuthorizeAsync(3998,"declined",Arg.Any<CancellationToken>()).Returns(Task.FromResult(false));
  var result=await new CheckoutService(inventory,payments,orders,notifier).PlaceAsync(new("BOOK-1",2,"declined"));
  Assert.Equal("Payment declined",result.Status);
  await orders.DidNotReceiveWithAnyArgs().SaveAsync(default,default!,default,default);
  await notifier.DidNotReceiveWithAnyArgs().OrderPlacedAsync(default);
 }
}
