import java.util.concurrent.*;
/** Java 5-compatible syntax, compiled using a modern JDK. */
public class FutureLab {
    static double measureVoltage() throws InterruptedException {
        Thread.sleep(2000); // Models blocking I/O, not CPU work.
        return 5.01;
    }
    public static void main(String[] args) throws Exception {
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            Future<Double> future = executor.submit(new Callable<Double>() {
                public Double call() throws Exception { return measureVoltage(); }
            });
            System.out.println("Doing other work");
            try { System.out.println(future.get(3, TimeUnit.SECONDS)); }
            catch (TimeoutException ex) { future.cancel(true); throw ex; }
            catch (ExecutionException ex) { System.err.println(ex.getCause()); throw ex; }
        } finally {
            executor.shutdown();
            if (!executor.awaitTermination(5, TimeUnit.SECONDS)) executor.shutdownNow();
        }
    }
}
