import java.util.concurrent.*;
/** Java 21+, stable virtual threads; no preview APIs. */
public class VirtualLab {
    public static void main(String[] args) throws Exception {
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            var v = executor.submit(() -> { Thread.sleep(2000); return 5.0; });
            var i = executor.submit(() -> { Thread.sleep(2000); return 0.2; });
            System.out.println(v.get() * i.get());
        } // Waits for tasks. This is not a fail-fast sibling-cancellation policy.
    }
}
