import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

/** Store and pass the same pending outcome handle, including a safe cross-thread handoff. */
public class FuturePassingLab {
    /** An object field can retain a pending Future, just like any other object reference. */
    static class MeasurementRequest {
        final Future<Double> voltage;
        MeasurementRequest(Future<Double> voltage) { this.voltage = voltage; }
    }

    public static void main(String[] args) throws Exception {
        ExecutorService worker = Executors.newSingleThreadExecutor();
        try {
            Future<Double> pending = worker.submit(new Callable<Double>() {
                public Double call() throws Exception { Thread.sleep(1000); return 5.01; }
            });
            Future<Double> alias = pending; // Copy reference, not work or eventual value.
            MeasurementRequest request = new MeasurementRequest(pending);
            List<Future<Double>> measurements = new ArrayList<Future<Double>>();
            measurements.add(pending); // This list is only accessed by this caller.
            System.out.println("All references point to same Future: " +
                (alias == request.voltage && alias == measurements.get(0)));

            // In production this could be consumed by another already-running component.
            BlockingQueue<Future<Double>> inbox = new LinkedBlockingQueue<Future<Double>>();
            inbox.put(pending); // Safe publication to another thread, no waiting for the result.
            Future<Double> received = inbox.take(); // A receiver retains the same handle.
            System.out.println("Queue handoff preserved identity: " + (received == pending));
            System.out.println("Value: " + readResult(received));
            System.out.println("Read again, no rerun: " + alias.get());
        } finally {
            worker.shutdownNow();
            if (!worker.awaitTermination(5, TimeUnit.SECONDS)) {
                throw new IllegalStateException("Worker did not terminate");
            }
        }
    }

    /** A normal method parameter can accept a Future while it is pending or completed. */
    private static double readResult(Future<Double> measurement)
        throws InterruptedException, ExecutionException {
        return measurement.get();
    }
}
