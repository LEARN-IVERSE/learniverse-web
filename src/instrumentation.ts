import { registerOTel } from "@vercel/otel";

// OpenTelemetry for the Next.js server runtime.
// The OTLP exporter is configured via OTEL_EXPORTER_OTLP_ENDPOINT (see .env.example).
export function register() {
  registerOTel({
    serviceName: "learniverse-web",
    instrumentationConfig: {
      fetch: {
        // Send traceparent on calls to the API so FE -> BE spans join one trace
        propagateContextUrls: [process.env.API_URL ?? "http://localhost:8000"],
      },
    },
  });
}
