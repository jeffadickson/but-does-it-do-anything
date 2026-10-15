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
            CompletableFuture<Double> power = v.thenCombine(i, (volts, amps) -> volts * amps);
            CompletableFuture<Double> calibrated = v.thenApply(volts -> volts * 1.001);
            CompletableFuture<Double> followup = calibrated.thenCompose(volts ->
                CompletableFuture.supplyAsync(() -> read(volts + 0.01), io));
            CompletableFuture.allOf(power, followup).join();
            System.out.println(power.join() + " W; followup " + followup.join());
            System.out.println("First terminal: " + CompletableFuture.anyOf(v, i).join());
            System.out.println(CompletableFuture.<Double>supplyAsync(() -> {
                throw new IllegalStateException("Simulated failure");
            }, io).exceptionally(ex -> Double.NaN).join());
        } finally { io.shutdown(); }
    }
}
