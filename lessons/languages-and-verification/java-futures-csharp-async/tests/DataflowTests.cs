using System.Threading.Tasks.Dataflow;
using Xunit;

public class DataflowTests
{
    private static TaskCompletionSource<bool> Gate() =>
        new(TaskCreationOptions.RunContinuationsAsynchronously);

    [Fact]
    public async Task Capacity_includes_active_work_and_SendAsync_means_admission()
    {
        using var stop = new CancellationTokenSource();
        var entered = Gate(); var release = Gate();
        int completed = 0;
        var block = new ActionBlock<int>(async id =>
        {
            entered.TrySetResult(true);
            await release.Task.WaitAsync(stop.Token);
            Interlocked.Increment(ref completed);
        }, new ExecutionDataflowBlockOptions
        {
            BoundedCapacity = 1, CancellationToken = stop.Token
        });
        try
        {
            Assert.True(await block.SendAsync(1, stop.Token));
            await entered.Task.WaitAsync(TimeSpan.FromSeconds(5));
            Assert.Equal(0, completed); // Accepted does not mean processed.
            Assert.False(block.Post(2)); // No room while delegate is active.
            Task<bool> pending = block.SendAsync(2, stop.Token);
            Assert.False(pending.IsCompleted);
            release.SetResult(true);
            Assert.True(await pending.WaitAsync(TimeSpan.FromSeconds(5)));
            block.Complete();
            await block.Completion.WaitAsync(TimeSpan.FromSeconds(5));
            Assert.Equal(2, completed);
        }
        finally
        {
            release.TrySetResult(true); stop.Cancel(); block.Complete();
            try { await block.Completion.WaitAsync(TimeSpan.FromSeconds(5)); }
            catch (OperationCanceledException) { }
        }
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task Output_order_is_distinct_from_delegate_completion(bool ordered)
    {
        using var stop = new CancellationTokenSource();
        var releaseFirst = Gate(); var secondComputed = Gate();
        var block = new TransformBlock<int,int>(async id =>
        {
            if (id == 1) await releaseFirst.Task.WaitAsync(stop.Token);
            else secondComputed.TrySetResult(true);
            return id;
        }, new ExecutionDataflowBlockOptions
        {
            MaxDegreeOfParallelism = 2, EnsureOrdered = ordered,
            BoundedCapacity = 2, CancellationToken = stop.Token
        });
        try
        {
            Assert.True(await block.SendAsync(1, stop.Token));
            Assert.True(await block.SendAsync(2, stop.Token));
            await secondComputed.Task.WaitAsync(TimeSpan.FromSeconds(5));
            Task<int> output = block.ReceiveAsync(stop.Token);
            if (ordered)
            {
                Assert.False(output.IsCompleted); // First is still held.
                releaseFirst.SetResult(true);
                Assert.Equal(1, await output.WaitAsync(TimeSpan.FromSeconds(5)));
                Assert.Equal(2, await block.ReceiveAsync(stop.Token).WaitAsync(TimeSpan.FromSeconds(5)));
            }
            else
            {
                Assert.Equal(2, await output.WaitAsync(TimeSpan.FromSeconds(5)));
                releaseFirst.SetResult(true);
                Assert.Equal(1, await block.ReceiveAsync(stop.Token).WaitAsync(TimeSpan.FromSeconds(5)));
            }
            block.Complete();
            await block.Completion.WaitAsync(TimeSpan.FromSeconds(5));
        }
        finally
        {
            releaseFirst.TrySetResult(true); stop.Cancel(); block.Complete();
            try { await block.Completion.WaitAsync(TimeSpan.FromSeconds(5)); }
            catch (OperationCanceledException) { }
        }
    }
    [Fact]
    public async Task Downstream_fault_releases_a_producer_waiting_for_capacity()
    {
        using var stop = new CancellationTokenSource();
        var entered = Gate(); var fail = Gate();
        var source = new TransformBlock<int,int>(id => id,
            new ExecutionDataflowBlockOptions { BoundedCapacity = 1, CancellationToken = stop.Token });
        var sink = new ActionBlock<int>(async id =>
        {
            entered.TrySetResult(true);
            await fail.Task.WaitAsync(stop.Token);
            throw new InvalidOperationException("sink failed");
        }, new ExecutionDataflowBlockOptions { BoundedCapacity = 1, CancellationToken = stop.Token });
        using var link = source.LinkTo(sink, new DataflowLinkOptions { PropagateCompletion = true });
        async Task Own(Task work)
        {
            try { await work; }
            catch { stop.Cancel(); throw; }
        }
        Task sourceOwner = Own(source.Completion), sinkOwner = Own(sink.Completion);
        Task? sendOwner = null;
        try
        {
            Assert.True(await source.SendAsync(1, stop.Token));
            await entered.Task.WaitAsync(TimeSpan.FromSeconds(5));
            Assert.True(await source.SendAsync(2, stop.Token));
            Task<bool> pending = source.SendAsync(3, stop.Token);
            Assert.False(pending.IsCompleted); // Sink holds 1, source holds 2.
            sendOwner = Own(pending);
            Task all = Task.WhenAll(sourceOwner, sinkOwner, sendOwner);
            fail.SetResult(true);
            await Assert.ThrowsAsync<InvalidOperationException>(
                async () => await all.WaitAsync(TimeSpan.FromSeconds(5)));
            Assert.True(source.Completion.IsCompleted);
            Assert.True(sink.Completion.IsFaulted);
            Assert.True(pending.IsCompleted);
            Assert.Contains(all.Exception!.Flatten().InnerExceptions,
                error => error.Message == "sink failed");
        }
        finally
        {
            stop.Cancel(); fail.TrySetResult(true); source.Complete(); sink.Complete();
            Task cleanup = Task.WhenAll(sourceOwner, sinkOwner, sendOwner ?? Task.CompletedTask);
            try { await cleanup.WaitAsync(TimeSpan.FromSeconds(5)); }
            catch when (cleanup.IsCompleted) { /* Expected faults already observed above. */ }
        }
    }
}
