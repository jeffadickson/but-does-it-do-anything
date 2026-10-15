using System.Diagnostics;
using System.Runtime.CompilerServices;
using System.Text.Json;

// Executable software simulation; no VISA driver or physical instrument connection.
using var stop = new CancellationTokenSource();
Console.CancelKeyPress += (_, e) => { e.Cancel = true; stop.Cancel(); };
var result = await new ExperimentRunner(new SimGenerator(), new SimMeter())
    .RunAsync(new[] { 10.0, 100.0, 1000.0 }, stop.Token);
Console.WriteLine(JsonSerializer.Serialize(result));
if (args.Contains("--self-test")) await SelfTests.RunAsync();

public record MeasurementConfiguration(double Range, double IntegrationSeconds);
public record Point(double FrequencyHz, double InputVolts, double OutputVolts, double GainDb);
public record ExperimentResult(string State, IReadOnlyList<Point> Points, string? Error, string? CleanupError);
public interface IDigitalMultimeter
{
    Task ConfigureAsync(MeasurementConfiguration config, CancellationToken token = default);
    Task<double> MeasureAsync(CancellationToken token = default);
    IAsyncEnumerable<double> StreamAsync(CancellationToken token = default);
}
public interface IGenerator
{
    Task ConfigureAsync(CancellationToken token);
    Task SetFrequencyAsync(double hz, CancellationToken token);
    Task EnableAsync(CancellationToken token);
    Task DisableAsync(CancellationToken token);
}

/// <summary>Owns run tasks and attempts output disable, including after startup failure.</summary>
public sealed class ExperimentRunner(IGenerator generator, IDigitalMultimeter meter)
{
    private static readonly ActivitySource Activities = new("AsyncLesson.Experiments");
    public async Task<ExperimentResult> RunAsync(IEnumerable<double> frequencies, CancellationToken token)
    {
        var points = new List<Point>();
        string state = "Created";
        string? error = null, cleanupError = null;
        using var activity = Activities.StartActivity("frequency-response");
        void Log(string next) {
            state = next;
            Console.WriteLine(JsonSerializer.Serialize(new { state, count = points.Count, at = DateTimeOffset.UtcNow }));
        }
        Log("Created");
        try
        {
            Log("Startup");
            token.ThrowIfCancellationRequested();
            // Async wrappers capture even synchronous implementation failures as Tasks.
            // Both started children are drained before cleanup can touch their sessions.
            async Task ConfigureGeneratorAsync() => await generator.ConfigureAsync(token);
            async Task ConfigureMeterAsync() => await meter.ConfigureAsync(new(10, 0.02), token);
            await Task.WhenAll(ConfigureGeneratorAsync(), ConfigureMeterAsync());
            token.ThrowIfCancellationRequested();
            await generator.EnableAsync(token);
            Log("Running");
            foreach (var frequency in frequencies)
            {
                token.ThrowIfCancellationRequested();
                await generator.SetFrequencyAsync(frequency, token);
                await Task.Delay(20, token); // Explicit illustrative settling policy.
                double output = await meter.MeasureAsync(token);
                const double input = 1.0; // Simulated known source; real work measures/calibrates it.
                if (output <= 0) throw new InvalidOperationException("Positive RMS voltage required");
                points.Add(new(frequency, input, output, 20 * Math.Log10(output / input)));
                Console.WriteLine(JsonSerializer.Serialize(new { kind = "point", point = points[^1] }));
            }
            state = "Completed";
        }
        catch (OperationCanceledException) when (token.IsCancellationRequested) { state = "Cancelled"; }
        catch (Exception ex) { state = "Failed"; error = ex.ToString(); }
        finally
        {
            string outcome = state;
            Log("Cleanup");
            // A cancelled run token must not suppress the safety cleanup attempt.
            using var cleanup = new CancellationTokenSource(TimeSpan.FromSeconds(2));
            try { await generator.DisableAsync(cleanup.Token); }
            catch (Exception ex) { cleanupError = ex.ToString(); outcome = "Failed"; }
            Log(outcome);
        }
        return new(state, points, error, cleanupError);
    }
}

/// <summary>Workflow fixture: serial transactions, fixed 40 ms acquisition and 0.707 V.
/// Configuration values are accepted but do not change the synthetic reading.</summary>
public sealed class SimMeter : IDigitalMultimeter
{
    private readonly SemaphoreSlim session = new(1, 1);
    public bool Fail { get; set; }
    public async Task ConfigureAsync(MeasurementConfiguration config, CancellationToken token = default)
    {
        await session.WaitAsync(token);
        try { await Task.Delay(10, token); } finally { session.Release(); }
    }
    public async Task<double> MeasureAsync(CancellationToken token = default)
    {
        await session.WaitAsync(token);
        try {
            await Task.Delay(40, token);
            if (Fail) throw new TimeoutException("Simulated acquisition timeout");
            return 0.707;
        } finally { session.Release(); }
    }
    public async IAsyncEnumerable<double> StreamAsync([EnumeratorCancellation] CancellationToken token = default)
    {
        while (true) { yield return await MeasureAsync(token); }
        // No background producer or lock is held across yield.
    }
}
/// <summary>Command-latency fixture; frequency values do not affect simulated readings.</summary>
public sealed class SimGenerator : IGenerator
{
    public bool Enabled { get; private set; }
    public bool FailDisable { get; set; }
    public Task ConfigureAsync(CancellationToken token) => Task.Delay(10, token);
    public Task SetFrequencyAsync(double hz, CancellationToken token) => Task.Delay(10, token);
    public async Task EnableAsync(CancellationToken token) { await Task.Delay(10, token); Enabled = true; }
    public async Task DisableAsync(CancellationToken token) {
        await Task.Delay(10, token);
        if (FailDisable) throw new IOException("Disconnected output control");
        Enabled = false;
    }
}
public static class Patterns
{
    public static async Task<double> DifferenceAsync(IDigitalMultimeter a, IDigitalMultimeter b, CancellationToken token)
    {
        // Capture synchronous driver throws as faulted Tasks, so every started child is drained.
        async Task<double> ReadAsync(IDigitalMultimeter device) => await device.MeasureAsync(token);
        Task<double> first = ReadAsync(a);
        Task<double> second = ReadAsync(b);
        double[] results = await Task.WhenAll(first, second);
        return results[0] - results[1];
    }
    public static async Task<double> WithTimeoutAsync(IDigitalMultimeter meter, CancellationToken user)
    {
        using var deadline = CancellationTokenSource.CreateLinkedTokenSource(user);
        deadline.CancelAfter(TimeSpan.FromSeconds(3));
        try { return await meter.MeasureAsync(deadline.Token); }
        catch (OperationCanceledException) when (!user.IsCancellationRequested && deadline.IsCancellationRequested)
        { throw new TimeoutException("Measurement exceeded its cancellation budget"); }
    }
    public static async Task<double> BoundWaitAsync(IDigitalMultimeter meter, CancellationToken user)
    {
        using var operation = CancellationTokenSource.CreateLinkedTokenSource(user);
        Task<double> pending = meter.MeasureAsync(operation.Token);
        try { return await pending.WaitAsync(TimeSpan.FromSeconds(3), user); }
        finally {
            if (!pending.IsCompleted) operation.Cancel();
            // Drain can outlive three seconds; no generic safe forced Task abort exists.
            try { await pending; } catch (Exception) { /* Preserve original wait failure. */ }
        }
    }
}
public static class SelfTests
{
    public static async Task RunAsync()
    {
        static void Check(bool ok, string message) { if (!ok) throw new Exception(message); }
        var g = new SimGenerator(); var m = new SimMeter(); var run = new ExperimentRunner(g, m);
        Check((await run.RunAsync(new[] { 10.0 }, default)).State == "Completed" && !g.Enabled, "success cleanup");
        m.Fail = true;
        Check((await run.RunAsync(new[] { 10.0 }, default)).State == "Failed" && !g.Enabled, "fault cleanup");
        using var cancel = new CancellationTokenSource(); cancel.Cancel();
        Check((await run.RunAsync(new[] { 10.0 }, cancel.Token)).State == "Cancelled" && !g.Enabled, "cancel cleanup");
        m.Fail = false; g.FailDisable = true;
        var unsafeResult = await run.RunAsync(new[] { 10.0 }, default);
        Check(unsafeResult.State == "Failed" && unsafeResult.CleanupError is not null, "cleanup error");
        Task all = Task.WhenAll(Task.FromException(new IOException("A")), Task.FromException(new TimeoutException("B")));
        try { await all; } catch (Exception) { }
        Check(all.Exception?.InnerExceptions.Count == 2, "all faults retained");
        int count = 0;
        await foreach (double value in new SimMeter().StreamAsync()) { if (++count == 3) break; }
        Check(count == 3, "stream termination");
        Console.WriteLine("SELF TESTS PASSED");
    }
}
