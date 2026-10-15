using NSubstitute;
using Xunit;

public class WorkflowTests
{
    private static TaskCompletionSource<T> Gate<T>() => new(TaskCreationOptions.RunContinuationsAsynchronously);

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task Both_configurations_must_finish_and_acquisition_precedes_disable(bool meterFirst)
    {
        var generator = Substitute.For<IGenerator>();
        var meter = Substitute.For<IDigitalMultimeter>();
        var gReady = Gate<bool>(); var mReady = Gate<bool>();
        var acquisition = Gate<double>(); var entered = Gate<bool>();
        generator.ConfigureAsync(Arg.Any<CancellationToken>()).Returns(gReady.Task);
        meter.ConfigureAsync(Arg.Any<MeasurementConfiguration>(), Arg.Any<CancellationToken>()).Returns(mReady.Task);
        meter.MeasureAsync(Arg.Any<CancellationToken>()).Returns(_ => { entered.TrySetResult(true); return acquisition.Task; });
        var run = new ExperimentRunner(generator, meter).RunAsync(new[] { 100.0 }, default);
        await generator.DidNotReceive().EnableAsync(Arg.Any<CancellationToken>());
        (meterFirst ? mReady : gReady).SetResult(true);
        // WhenAll cannot complete while the other gate remains pending.
        await generator.DidNotReceive().EnableAsync(Arg.Any<CancellationToken>());
        (meterFirst ? gReady : mReady).SetResult(true);
        await entered.Task.WaitAsync(TimeSpan.FromSeconds(5));
        await generator.Received(1).EnableAsync(Arg.Any<CancellationToken>());
        await generator.DidNotReceive().DisableAsync(Arg.Any<CancellationToken>());
        acquisition.SetResult(0.5);
        var result = await run.WaitAsync(TimeSpan.FromSeconds(5));
        Assert.Equal("Completed", result.State);
        await generator.Received(1).DisableAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Acquisition_failure_still_disables_output()
    {
        var generator = Substitute.For<IGenerator>(); var meter = Substitute.For<IDigitalMultimeter>();
        meter.MeasureAsync(Arg.Any<CancellationToken>()).Returns(Task.FromException<double>(new TimeoutException("device")));
        var result = await new ExperimentRunner(generator, meter).RunAsync(new[] { 100.0 }, default);
        Assert.Equal("Failed", result.State);
        Assert.Contains("device", result.Error);
        await generator.Received(1).DisableAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Cancelled_run_uses_fresh_cleanup_token()
    {
        var generator = Substitute.For<IGenerator>(); var meter = Substitute.For<IDigitalMultimeter>();
        using var cts = new CancellationTokenSource(); cts.Cancel();
        var result = await new ExperimentRunner(generator, meter).RunAsync(new[] { 100.0 }, cts.Token);
        Assert.Equal("Cancelled", result.State);
        await generator.DidNotReceive().EnableAsync(Arg.Any<CancellationToken>());
        await generator.Received().DisableAsync(Arg.Is<CancellationToken>(t => !t.IsCancellationRequested));
    }

    [Fact]
    public async Task Synchronous_configuration_failure_does_not_abandon_started_sibling()
    {
        var generator = Substitute.For<IGenerator>(); var meter = Substitute.For<IDigitalMultimeter>();
        var pending = Gate<bool>();
        generator.ConfigureAsync(Arg.Any<CancellationToken>()).Returns(pending.Task);
        meter.ConfigureAsync(Arg.Any<MeasurementConfiguration>(), Arg.Any<CancellationToken>())
            .Returns(_ => throw new IOException("synchronous driver failure"));
        var run = new ExperimentRunner(generator, meter).RunAsync(new[] { 100.0 }, default);
        Assert.False(run.IsCompleted);
        await generator.DidNotReceive().DisableAsync(Arg.Any<CancellationToken>());
        pending.SetResult(true);
        Assert.Equal("Failed", (await run.WaitAsync(TimeSpan.FromSeconds(5))).State);
        await generator.DidNotReceive().EnableAsync(Arg.Any<CancellationToken>());
        await generator.Received(1).DisableAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task WhenAll_keeps_all_faults_and_does_not_cancel_siblings()
    {
        var sibling = Gate<double>();
        Task all = Task.WhenAll(Task.FromException<double>(new IOException("A")), sibling.Task);
        Assert.False(all.IsCompleted);
        Assert.False(sibling.Task.IsCanceled);
        sibling.SetException(new TimeoutException("B"));
        await Assert.ThrowsAnyAsync<Exception>(() => all);
        Assert.Equal(2, all.Exception!.InnerExceptions.Count);
    }

    [Fact]
    public async Task WaitAsync_timeout_does_not_cancel_source()
    {
        var source = Gate<double>();
        await Assert.ThrowsAsync<TimeoutException>(() => source.Task.WaitAsync(TimeSpan.FromMilliseconds(10)));
        Assert.False(source.Task.IsCompleted);
        source.SetResult(5);
        Assert.Equal(5, await source.Task);
    }
}
