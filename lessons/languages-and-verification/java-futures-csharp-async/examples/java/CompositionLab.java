import java.util.concurrent.*;
/** Java 8+. Dedicated executor for blocking instrument simulations. */
public class CompositionLab {
    static double read(double value) {
        try { Thread.sleep(200); return value; }
        catch (InterruptedException ex) {
            Thread.currentThread().interrupt(); throw new CompletionException(ex);
        }
    }
    public static void main(String[] args) {
        ExecutorService io = Executors.newFixedThreadPool(3);
        try {
            CompletableFuture<Double> v = CompletableFuture.supplyAsync(() -> read(5.0), io);
            CompletableFuture<Double> i = CompletableFuture.supplyAsync(() -> read(0.2), io);
            // Register the race before waiting for dependent results.
            CompletableFuture<Object> firstTerminal = CompletableFuture.anyOf(v, i);
            CompletableFuture<Double> calibrated = v.thenApply(volts -> volts * 1.001);
            CompletableFuture<Double> power = calibrated.thenCombine(i, (volts, amps) -> volts * amps);
            CompletableFuture<Double> followup = calibrated.thenCompose(volts ->
                CompletableFuture.supplyAsync(() -> read(volts + 0.01), io));
            // A raw value alone does not identify which instrument produced it.
            System.out.println("First observed terminal value: " + firstTerminal.join());
            CompletableFuture.allOf(power, followup).join();
            System.out.println(power.join() + " W; followup " + followup.join());
            System.out.println(CompletableFuture.<Double>supplyAsync(() -> {
                throw new IllegalStateException("Simulated failure");
            }, io).exceptionally(ex -> Double.NaN).join());
        } finally { io.shutdown(); }
    }
}
