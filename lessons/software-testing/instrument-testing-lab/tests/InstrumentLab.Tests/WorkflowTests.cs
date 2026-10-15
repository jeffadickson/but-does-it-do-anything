using InstrumentLab;
using NSubstitute;
using WireMock.Server;
using WireMock.RequestBuilders;
using WireMock.ResponseBuilders;
using Xunit;
namespace InstrumentLab.Tests;
public sealed class WorkflowTests {
    [Fact]
    public async Task Safe_command_order_calibration_and_store_are_observed() {
        var gen = Substitute.For<IVisaInstrument>();
        var meter = Substitute.For<IVisaInstrument>();
        var store = Substitute.For<IMeasurementStore>();
        meter.QueryAsync("MEAS:POW?", Arg.Any<CancellationToken>()).Returns("-21.5");
        using var server = WireMockServer.Start();
        server.Given(Request.Create().WithPath("/api/calibration").UsingGet()).RespondWith(Response.Create().WithStatusCode(200).WithHeader("Content-Type", "application/json").WithBody("{\"correctionDb\":0.7}"));
        using var http = new HttpClient { BaseAddress = new Uri(server.Urls[0]) };
        var result = await new MeasurementWorkflow(gen, meter, new CalibrationClient(http), store).RunAsync(1_000_000);
        Assert.Equal(-20.8, result.CorrectedDbm, 8);
        Received.InOrder(() => {
            gen.WriteAsync("OUTP OFF", Arg.Any<CancellationToken>());
            gen.WriteAsync("FREQ 1000000", Arg.Any<CancellationToken>());
            gen.WriteAsync("POW -20 DBM", Arg.Any<CancellationToken>());
            gen.WriteAsync("OUTP ON", Arg.Any<CancellationToken>());
            meter.QueryAsync("MEAS:POW?", Arg.Any<CancellationToken>());
            gen.WriteAsync("OUTP OFF", Arg.Any<CancellationToken>());
        });
        await store.Received(1).SaveAsync(Arg.Is<Measurement>(x => Math.Abs(x.CorrectedDbm + 20.8) < 1e-6), Arg.Any<CancellationToken>());
        Assert.Single(server.FindLogEntries(Request.Create().WithPath("/api/calibration").UsingGet()));
    }
    [Fact]
    public async Task Http_503_stops_output_and_does_not_save() {
        var gen = Substitute.For<IVisaInstrument>();
        var meter = Substitute.For<IVisaInstrument>();
        var store = Substitute.For<IMeasurementStore>();
        meter.QueryAsync("MEAS:POW?", Arg.Any<CancellationToken>()).Returns("-21.5");
        using var server = WireMockServer.Start();
        server.Given(Request.Create().WithPath("/api/calibration").UsingGet()).RespondWith(Response.Create().WithStatusCode(503));
        using var http = new HttpClient { BaseAddress = new Uri(server.Urls[0]) };
        await Assert.ThrowsAsync<HttpRequestException>(() => new MeasurementWorkflow(gen, meter, new CalibrationClient(http), store).RunAsync(1_000_000));
        await gen.Received(2).WriteAsync("OUTP OFF", Arg.Any<CancellationToken>());
        await store.DidNotReceive().SaveAsync(Arg.Any<Measurement>(), Arg.Any<CancellationToken>());
    }
    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(double.NaN)]
    public async Task Invalid_frequency_never_touches_instruments(double hz) {
        var gen = Substitute.For<IVisaInstrument>();
        var sut = new MeasurementWorkflow(gen, Substitute.For<IVisaInstrument>(), new CalibrationClient(new HttpClient()), Substitute.For<IMeasurementStore>());
        await Assert.ThrowsAsync<ArgumentOutOfRangeException>(() => sut.RunAsync(hz));
        await gen.DidNotReceiveWithAnyArgs().WriteAsync(default!, default);
    }
}
